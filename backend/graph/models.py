from django.db import models

class CsvData(models.Model):
    file = models.FileField(upload_to='uploads/', default='default_file.csv')  # Example default value
    uploaded_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"CSV Data {self.id}"

class Graph(models.Model):
    csv_data = models.ForeignKey(CsvData, on_delete=models.CASCADE, related_name='graphs')  
    image_url = models.URLField(blank=True, null=True)  # URL of the graph image
    image_base64 = models.TextField(blank=True, null=True)  # Base64 encoded graph image
    code = models.TextField()  # Code used to generate the graph
    created_at = models.DateTimeField(auto_now_add=True)  

    def __str__(self):
        return f"Graph {self.id} for CSV Data {self.csv_data.id}"
