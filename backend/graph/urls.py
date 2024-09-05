from django.urls import path
from .views import (
    execute_code,
    home,
    filter_graph,
    get_unique_values,
    get_available_segment_columns,
    get_available_years,
    filter_graph_by_chronology,
    get_date_columns  ,
    upload_file,delete_files, available_files,get_file_by_id,get_all_graphs,show_session_key,initialize_session,set_session_data,get_session_data
)

urlpatterns = [
    path('', home, name='home'),
    path('execute/', execute_code, name='execute_code'),
    path('filter/', filter_graph, name='filter_graph'),
    path('filter-chronology/', filter_graph_by_chronology, name='filter_graph_by_chronology'),
    path('segments/', get_available_segment_columns, name='get_available_segment_columns'),
    path('unique-values/', get_unique_values, name='get_unique_values'),
    path('available-years/', get_available_years, name='get_available_years'),
    path('date-columns/', get_date_columns, name='get_date_columns')  ,
    path('upload/', upload_file, name='upload_file')  ,
    path('delete/', delete_files, name='delete_files')  ,
    path('available-files/', available_files, name='available_files'),
    path('file/<int:file_id>/', get_file_by_id, name='get_file_by_id'),
    path('get-all-graphs/', get_all_graphs, name='get_all_graphs'),
    path('show-session-key/', show_session_key, name='show_session_key'),
    path('initialize-session/', initialize_session, name='initialize_session'),
    path('set-session/', set_session_data, name='set_session_data'),
    path('get-session/', get_session_data, name='get_session_data'),







]
