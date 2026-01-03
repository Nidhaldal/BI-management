from django.shortcuts import render
import logging
import json
import pandas as pd
import numpy as np
from django.shortcuts import get_object_or_404
from datetime import datetime
from django.http import JsonResponse, HttpResponseBadRequest,HttpResponse,Http404,HttpResponseServerError
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from .models import CsvData, Graph
import pandas as pd
from PIL import Image
import mimetypes
import traceback

from django.core.files.base import ContentFile
from io import BytesIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import os

logger = logging.getLogger(__name__)

def home(request):
    return render(request, 'home.html')
@csrf_exempt
def upload_file(request):
    if request.method == 'POST':
        files = request.FILES.getlist('files')
        if not files:
            return HttpResponseBadRequest("No files uploaded")

        file_urls = []
        file_ids = []

        for uploaded_file in files:
            if not uploaded_file.name.lower().endswith(('.csv', '.xls', '.xlsx')):
                return HttpResponseBadRequest("Unsupported file format")

            try:
                file_name = default_storage.save(uploaded_file.name, uploaded_file)
                file_url = default_storage.url(file_name)
                
                csv_data = CsvData(file=uploaded_file)  
                csv_data.save()

                file_urls.append(file_url)
                file_ids.append(csv_data.id)

            except Exception as e:
                logger.error('Unexpected error: %s', e)
                return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

        return JsonResponse({'file_urls': file_urls, 'file_ids': file_ids})

    else:
        return HttpResponseBadRequest("Only POST method is allowed")


   
   
@csrf_exempt 
def available_files(request):
    try:
        files = CsvData.objects.all()

        file_list = [{'id': file.id, 'name': file.file.name} for file in files]

        return JsonResponse({'files': file_list})

    except Exception as e:
        print(f"Error: {e}")
        return JsonResponse({'error': 'Internal Server Error'}, status=500)
    
    
def get_all_graphs(request):
    if request.method == 'GET':
        graphs = Graph.objects.all()

        graphs_data = []
        for graph in graphs:
            graphs_data.append({
                'id': graph.id,
                'csv_data_id': graph.csv_data.id,
                'image_url': graph.image_url,
                'image_base64': graph.image_base64,
                'code': graph.code,
                'created_at': graph.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            })

        return JsonResponse({'graphs': graphs_data})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)
    
@csrf_exempt
def get_file_by_id(request, file_id):
    logger.info(f"Received request to fetch file with ID: {file_id}")
    try:
        file_instance = CsvData.objects.get(id=file_id)
        logger.info(f"File instance retrieved: {file_instance}")

        file_path = file_instance.file.path
        logger.info(f"Attempting to open file at path: {file_path}")

        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{file_instance.file.name}"'
            return response
    except CsvData.DoesNotExist:
        logger.error(f"No file found with ID: {file_id}")
        raise Http404("File does not exist")
    except Exception as e:
        logger.error(f"Unexpected error occurred: {e}")
        return HttpResponse(status=500)
    
@csrf_exempt
def execute_code(request):
    if request.method == 'POST':
        try:
            file_id = request.POST.get('file_id')
            code = request.POST.get('code')

            if not file_id or not code:
                return HttpResponseBadRequest("Missing file ID or code")

            csv_data = get_object_or_404(CsvData, id=file_id)
            file_name = csv_data.file.name
            file_path = default_storage.path(file_name)

            if not os.path.exists(file_path):
                with default_storage.open(file_name, 'rb') as src_file:
                    with open(file_path, 'wb') as dst_file:
                        dst_file.write(src_file.read())

            if file_name.lower().endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_name.lower().endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_path, engine='openpyxl' if file_name.lower().endswith('.xlsx') else 'xlrd')
            else:
                return HttpResponseBadRequest("Unsupported file format")

            df.columns = df.columns.str.strip()

            exec_globals = {'pd': pd, 'plt': plt, 'io': io, 'base64': base64, 'df': df}
            exec_locals = {}
            try:
                exec(code, exec_globals, exec_locals)
                image_base64 = exec_locals.get('image_base64', '')

                if not image_base64:
                    return JsonResponse({'error': 'No image_base64 returned from code execution'}, status=400)

                graph = Graph.objects.create(
                    csv_data=csv_data,
                    code=code,
                    image_base64=image_base64
                )

                return JsonResponse({'graph_id': graph.id, 'graph': image_base64, 'data': df.to_dict(orient='records')})

            except Exception as e:
                logger.error('Error executing code: %s', e)
                return JsonResponse({'error': str(e)}, status=500)

        except Exception as e:
            logger.error('Unexpected error: %s', e)
            return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

    else:
        return HttpResponseBadRequest("Only POST method is allowed")
@csrf_exempt
def filter_graph(request):
    if request.method == 'POST':
        if request.content_type.startswith('multipart/form-data'):
            file_ids = request.POST.get('file_ids')
            column = request.POST.get('column')
            filters = request.POST.get('filters')

            if file_ids and column and filters:
                logger.info(f"Received column: {column}, filters: {filters}, file_ids: {file_ids}")

            try:
                file_ids = json.loads(file_ids)
                filters = json.loads(filters)
            except (ValueError, json.JSONDecodeError) as e:
                return HttpResponseBadRequest("Invalid file IDs or filters format")

            if column not in filters:
                return HttpResponseBadRequest(f"Column {column} not found in filters")

            unique_values = filters[column]

            if len(file_ids) != 1:
                return HttpResponseBadRequest("Expected exactly one file_id")
            file_id = file_ids[0]

            csv_data = get_object_or_404(CsvData, id=file_id)
            file_name = csv_data.file.name
            file_path = default_storage.path(file_name)

            if not os.path.exists(file_path):
                with default_storage.open(file_name, 'rb') as src_file:
                    with open(file_path, 'wb') as dst_file:
                        dst_file.write(src_file.read())

            if file_name.lower().endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_name.lower().endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_path, engine='openpyxl' if file_name.lower().endswith('.xlsx') else 'xlrd')
            else:
                return HttpResponseBadRequest("Unsupported file format")

            df.columns = df.columns.str.strip()

            if column in df.columns:
                if isinstance(unique_values, list):
                    filtered_df = df[df[column].isin(unique_values)]
                else:
                    return HttpResponseBadRequest(f"Unique values for column {column} are not in list format")
            else:
                return HttpResponseBadRequest(f"Column {column} not found in dataset")

            graphs = Graph.objects.filter(csv_data=csv_data).order_by('id')
            if not graphs:
                return HttpResponseBadRequest("No graphs found for the provided CSV data")

            results = []
            for graph in graphs:
                graph_code = graph.code

                try:
                    plt.figure(figsize=(10, 6))
                    exec_globals = {'pd': pd, 'plt': plt, 'io': io, 'base64': base64, 'df': filtered_df}
                    exec_locals = {}

                    exec(graph_code, exec_globals, exec_locals)
                    image_base64 = exec_locals.get('image_base64', '')

                    if not image_base64:
                        continue

                    plt.close()
                    
                    results.append({
                        'image': image_base64,
                        'url': f'/path/to/graphs/{graph.id}.png'  
                    })
                    logger.info(f"Base64-encoded image: {image_base64}...")  

                except Exception as e:
                    import traceback
                    logger.error(f"Error generating graph ID {graph.id}: {traceback.format_exc()}")

            if results:
                response_data = {
                    'graphs': results,
                    'filtered_data': filtered_df.to_dict(orient='records')  
                }

                logger.info(f"Filtered data: {filtered_df.head().to_dict(orient='records')}")
                logger.info(f"Generated graphs: {[result['url'] for result in results]}")

                return JsonResponse(response_data)

            return HttpResponseServerError("Error generating graphs")

        else:
            return HttpResponseBadRequest("Unsupported Content-Type")

    else:
        return HttpResponseBadRequest("Only POST method is allowed")
    
    
@csrf_exempt

def get_available_segment_columns(request):
    if request.method == 'GET':
        file_id = request.GET.get('file_id')

        logger.debug(f"Full query string: {request.META.get('QUERY_STRING', '')}")
        logger.debug(f"Received file_id: {file_id}")

        if file_id:
            try:
                csv_data = CsvData.objects.get(id=file_id)
                file = csv_data.file
                file_path = default_storage.path(file.name)

                if not os.path.exists(file_path):
                    with default_storage.open(file.name, 'rb') as src_file:
                        with open(file_path, 'wb') as dst_file:
                            dst_file.write(src_file.read())

                if file.name.lower().endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif file.name.lower().endswith(('.xls', '.xlsx')):
                    df = pd.read_excel(file_path, engine='openpyxl' if file.name.lower().endswith('.xlsx') else 'xlrd')
                else:
                    return HttpResponseBadRequest("Unsupported file format")

                columns = list(df.columns)
                logger.debug(f"Columns found: {columns}")
                return JsonResponse({'columns': columns})

            except Exception as e:
                logger.error(f"Error processing file {file.name}: {e}")
                return JsonResponse({'error': f'Error processing file {file.name}'}, status=500)

        else:
            logger.error("File ID is missing from the request.")
            return HttpResponseBadRequest("File ID is required")

    else:
        logger.error("Request method is not GET.")
        return HttpResponseBadRequest("Only GET method is allowed")
@csrf_exempt
def delete_files(request):
    if request.method == 'POST':
        try:
            file_ids = request.POST.getlist('file_ids')  

            if not file_ids:
                return HttpResponseBadRequest("Missing file IDs")

            for file_id in file_ids:
                try:
                    csv_data = CsvData.objects.get(id=file_id)
                    file_path = csv_data.file.path
                    csv_data.delete()  

                    if os.path.exists(file_path):
                        os.remove(file_path)
                except CsvData.DoesNotExist:
                    logger.warning(f"File with ID {file_id} not found")
                    continue

            return JsonResponse({'status': 'success', 'message': 'Files deleted successfully'})

        except Exception as e:
            logger.error('Unexpected error: %s', e)
            return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

    else:
        return HttpResponseBadRequest("Only POST method is allowed")
@csrf_exempt
def get_unique_values(request):
    if request.method == 'POST':
        try:
            file_ids = request.POST.getlist('file_ids[]')
            column = request.POST.get('column', '').strip()

            if not file_ids or not column:
                return HttpResponseBadRequest("Missing file IDs or column")

            unique_values = set()
            valid_file_ids = []  

            for file_id in file_ids:
                try:
                    csv_data = CsvData.objects.get(id=file_id)
                    file = csv_data.file
                    valid_file_ids.append(int(file_id))  
                except CsvData.DoesNotExist:
                    continue  

                file_path = default_storage.path(file.name)
                if not os.path.exists(file_path):
                    with default_storage.open(file.name, 'rb') as src_file:
                        with open(file_path, 'wb') as dst_file:
                            dst_file.write(src_file.read())

                if file.name.lower().endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif file.name.lower().endswith(('.xls', '.xlsx')):
                    df = pd.read_excel(file_path, engine='openpyxl' if file.name.lower().endswith('.xlsx') else 'xlrd')
                else:
                    continue  

                df.columns = df.columns.str.strip()

                if column in df.columns:
                    col_values = df[column].dropna().unique()
                    for value in col_values:
                        if isinstance(value, (np.int64, np.int32)):
                            unique_values.add(int(value))
                        elif isinstance(value, (np.float64, np.float32)):
                            unique_values.add(float(value))
                        elif isinstance(value, np.datetime64):
                            formatted_date = pd.to_datetime(value).strftime('%Y-%m-%d')
                            unique_values.add(formatted_date)
                        else:
                            unique_values.add(str(value))
                else:
                    continue  

            sorted_unique_values = sorted(unique_values)

            return JsonResponse({
                'unique_values': sorted_unique_values,
                'file_ids': valid_file_ids,  
                'column': column  
            })

        except Exception as e:
            return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)

    return HttpResponseBadRequest("Only POST method is allowed")
@csrf_exempt


def get_available_years(request):
    if request.method == 'GET':
        try:
            years = set()

            csv_files = CsvData.objects.all()

            for csv_data in csv_files:
                file = csv_data.file
                file_path = default_storage.path(file.name)

                if not os.path.exists(file_path):
                    with default_storage.open(file.name, 'rb') as src_file:
                        with open(file_path, 'wb') as dst_file:
                            dst_file.write(src_file.read())

                if file.name.lower().endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif file.name.lower().endswith(('.xls', '.xlsx')):
                    df = pd.read_excel(file_path, engine='openpyxl' if file.name.lower().endswith('.xlsx') else 'xlrd')
                else:
                    return HttpResponseBadRequest("Unsupported file format")

                for column in df.columns:
                    try:
                        df[column] = pd.to_datetime(df[column], format='%d/%m/%Y', errors='coerce')  # Specify the format
                        if df[column].dropna().dt.year.notnull().any():
                            years.update(df[column].dropna().dt.year.unique().astype(int))
                    except Exception as e:
                        logger.warning(f"Column '{column}' could not be converted to datetime: {e}")

            sorted_years = sorted(map(int, years)) 

            return JsonResponse({'years': sorted_years})

        except Exception as e:
            logger.error('Unexpected error: %s', e)
            return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

    else:
        return HttpResponseBadRequest("Only GET method is allowed")

@csrf_exempt
def filter_graph_by_chronology(request):
    if request.method == 'POST':
        try:
            logger.debug("Received POST request for filtering graphs by chronology.")

            years = request.POST.getlist('years')  
            months = request.POST.getlist('months')  
            start_month = request.POST.get('start_month')
            end_month = request.POST.get('end_month')

            logger.debug(f"Filter parameters received: years={years}, months={months}, start_month={start_month}, end_month={end_month}")

            if not (years or months or (start_month and end_month)):
                logger.error("Missing years, months, or date range.")
                return HttpResponseBadRequest("Missing years, months, or date range")

            years = [int(year) for year in years if year.isdigit()]
            months = [int(month) for month in months if month.isdigit()]
            start_month = int(start_month) if start_month and start_month.isdigit() else None
            end_month = int(end_month) if end_month and end_month.isdigit() else None

            logger.debug(f"Converted filter parameters: years={years}, months={months}, start_month={start_month}, end_month={end_month}")

            graphs = Graph.objects.all()
            logger.debug(f"Total graphs retrieved: {graphs.count()}")

            file_ids = set(graph.csv_data.id for graph in graphs)
            logger.debug(f"Unique file IDs retrieved: {file_ids}")

            graph_results = []
            for file_id in file_ids:
                try:
                    csv_data = CsvData.objects.get(id=file_id)
                    file = csv_data.file
                    logger.debug(f"Processing file: {file.name} (ID: {file_id})")
                except CsvData.DoesNotExist:
                    logger.error(f"CsvData with ID {file_id} does not exist.")
                    continue

                file_path = default_storage.path(file.name)
                if not os.path.exists(file_path):
                    with default_storage.open(file.name, 'rb') as src_file:
                        with open(file_path, 'wb') as dst_file:
                            dst_file.write(src_file.read())
                    logger.debug(f"File copied to local storage: {file_path}")

                if file.name.lower().endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif file.name.lower().endswith(('.xls', '.xlsx')):
                    df = pd.read_excel(file_path, engine='openpyxl' if file.name.lower().endswith('.xlsx') else 'xlrd')
                else:
                    logger.warning(f"Unsupported file format for file: {file.name}")
                    continue

                df.columns = [col.strip() for col in df.columns]
                logger.debug(f"Data columns after stripping: {df.columns.tolist()}")

                filtered_df = pd.DataFrame()  

                for column in df.columns:
                    logger.debug(f"Processing column: {column}")
                    if pd.api.types.is_datetime64_any_dtype(df[column]):
                        df[column] = pd.to_datetime(df[column], errors='coerce')

                        if years:
                            df = df[df[column].dt.year.isin(years)]
                            logger.debug(f"Data filtered by years: {years}")

                        if months:
                            df = df[df[column].dt.month.isin(months)]
                            logger.debug(f"Data filtered by months: {months}")

                        if start_month is not None and end_month is not None:
                            df = df[(df[column].dt.month >= start_month) & (df[column].dt.month <= end_month)]
                            logger.debug(f"Data filtered by month range: {start_month} - {end_month}")

                        filtered_df = df  
                        logger.debug(f"Filtered DataFrame shape: {filtered_df.shape}")

                        if not filtered_df.empty:
                            break 

                if filtered_df.empty:
                    logger.warning(f"No data left after filtering for file ID {file_id}.")
                    continue

                graphs = Graph.objects.filter(csv_data=csv_data).order_by('id')
                if not graphs:
                    logger.warning(f"No graphs found for file ID {file_id}")
                    continue

                for graph in graphs:
                    graph_code = graph.code
                    logger.debug(f"Processing graph ID: {graph.id} with code.")

                    try:
                        plt.figure(figsize=(10, 6))
                        exec_globals = {'pd': pd, 'plt': plt, 'io': io, 'base64': base64, 'df': filtered_df}
                        exec_locals = {}

                        exec(graph_code, exec_globals, exec_locals)
                        image_base64 = exec_locals.get('image_base64', '')

                        if not image_base64:
                            logger.warning(f"No image_base64 generated for graph ID: {graph.id}")
                            continue

                        plt.close()

                        graph_results.append({
                            'image_base64': image_base64
                        })

                    except Exception as e:
                        logger.error(f"Error generating graph ID {graph.id}: {traceback.format_exc()}")

            if graph_results:
                logger.debug(f"Returning results: {graph_results}")
                return JsonResponse({'graphs': graph_results})

            logger.error("No results to return after filtering.")
            return HttpResponseServerError("No results to return after filtering")

        except Exception as e:
            logger.error(f"Unexpected error: {traceback.format_exc()}")
            return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

    else:
        logger.error("Only POST method is allowed.")
        return HttpResponseBadRequest("Only POST method is allowed")


@csrf_exempt
def get_date_columns(request):
    if request.method == 'GET':
        try:
            date_columns = set()
            
            csv_data_records = CsvData.objects.all()
            
            for csv_data in csv_data_records:
                file = csv_data.file
                file_path = default_storage.path(file.name)
                
                if not os.path.exists(file_path):
                    with default_storage.open(file.name, 'rb') as src_file:
                        with open(file_path, 'wb') as dst_file:
                            dst_file.write(src_file.read())
                
                if file.name.lower().endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif file.name.lower().endswith(('.xls', '.xlsx')):
                    df = pd.read_excel(file_path, engine='openpyxl' if file.name.lower().endswith('.xlsx') else 'xlrd')
                else:
                    return HttpResponseBadRequest("Unsupported file format")
                
                df.columns = [col.strip() for col in df.columns]

                for column in df.columns:
                    try:
                        converted_dates = pd.to_datetime(df[column], infer_datetime_format=True, errors='coerce')
                        if converted_dates.notna().any() and not pd.api.types.is_numeric_dtype(df[column]):
                            date_columns.add(column)
                    except (ValueError, TypeError):
                        continue

            return JsonResponse({'date_columns': list(date_columns)})

        except Exception as e:
            logger.error('Unexpected error: %s', e)
            return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

    else:
        return HttpResponseBadRequest("Only GET method is allowed")

@csrf_exempt
def show_session_key(request):
    if request.method == 'GET':
        session_key = request.session.session_key
        return JsonResponse({'session_key': session_key})
    else:
        return HttpResponseBadRequest("Only GET method is allowed")
@csrf_exempt
def initialize_session(request):
    request.session['user'] = 'example_user'
    return JsonResponse({'status': 'Session initialized'})    
@csrf_exempt

def set_session_data(request):
    if request.method == 'POST':
        data = request.POST.get('data')
        request.session['my_data'] = data
        return JsonResponse({'status': 'Data saved to session'})
    return JsonResponse({'error': 'Invalid request'}, status=400)
@csrf_exempt

def get_session_data(request):
    data = request.session.get('my_data', 'No data found')
    return JsonResponse({'my_data': data})