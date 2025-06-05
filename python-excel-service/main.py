# main.py - Servidor FastAPI para extraer imágenes de Excel
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import base64
import zipfile
import shutil
from pathlib import Path
import json
from typing import List, Dict, Any
import traceback

app = FastAPI(title="Excel Image Extractor API", version="1.0.0")

# Configurar CORS para permitir conexiones desde Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8080"],  # URLs de desarrollo Angular
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExcelImageExtractor:
    """Clase para extraer imágenes de archivos Excel (.xlsx)"""
    
    @staticmethod
    def extract_images_from_excel(excel_path: str, output_dir: str) -> List[Dict[str, Any]]:
        """
        Extrae imágenes de un archivo Excel (.xlsx)
        Los archivos .xlsx son básicamente archivos ZIP que contienen XML y archivos multimedia
        """
        try:
            # Crear directorio de salida si no existe
            os.makedirs(output_dir, exist_ok=True)
            
            images_info = []
            
            # Los archivos .xlsx son archivos ZIP
            with zipfile.ZipFile(excel_path, 'r') as zip_file:
                # Buscar archivos multimedia en el ZIP
                media_files = [f for f in zip_file.namelist() if f.startswith('xl/media/')]
                
                if not media_files:
                    print("No se encontraron imágenes en el archivo Excel")
                    return []
                
                # Extraer cada imagen
                for media_file in media_files:
                    try:
                        # Obtener el nombre del archivo
                        filename = os.path.basename(media_file)
                        
                        # Extraer el archivo
                        zip_file.extract(media_file, output_dir)
                        
                        # Mover al directorio raíz de salida
                        src_path = os.path.join(output_dir, media_file)
                        dst_path = os.path.join(output_dir, filename)
                        
                        # Crear directorio padre si no existe
                        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                        
                        # Mover archivo
                        shutil.move(src_path, dst_path)
                        
                        # Obtener información del archivo
                        file_size = os.path.getsize(dst_path)
                        file_ext = os.path.splitext(filename)[1].lower()
                        
                        images_info.append({
                            "filename": filename,
                            "path": dst_path,
                            "size": file_size,
                            "extension": file_ext,
                            "original_path": media_file
                        })
                        
                        print(f"Imagen extraída: {filename}")
                        
                    except Exception as e:
                        print(f"Error extrayendo {media_file}: {str(e)}")
                        continue
                
                # Limpiar directorios temporales creados por la extracción
                xl_dir = os.path.join(output_dir, 'xl')
                if os.path.exists(xl_dir):
                    shutil.rmtree(xl_dir)
                    
            return images_info
            
        except Exception as e:
            print(f"Error procesando archivo Excel: {str(e)}")
            raise e

@app.get("/")
async def root():
    """Endpoint de prueba"""
    return {"message": "Excel Image Extractor API está funcionando"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "excel-image-extractor"}

@app.post("/extract-excel-images")
async def extract_images(file: UploadFile = File(...)):
    """
    Extrae imágenes de un archivo Excel y las devuelve como base64
    """
    if not file.filename.endswith(('.xlsx', '.xlsm')):
        raise HTTPException(
            status_code=400, 
            detail="Solo se permiten archivos Excel (.xlsx, .xlsm)"
        )
    
    temp_dir = None
    try:
        # Crear directorio temporal
        temp_dir = tempfile.mkdtemp()
        excel_path = os.path.join(temp_dir, file.filename)
        
        # Guardar archivo temporal
        with open(excel_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        print(f"Archivo guardado temporalmente: {excel_path}")
        print(f"Tamaño del archivo: {len(content)} bytes")
        
        # Extraer imágenes
        output_dir = os.path.join(temp_dir, "images")
        extractor = ExcelImageExtractor()
        images_info = extractor.extract_images_from_excel(excel_path, output_dir)
        
        if not images_info:
            return {
                "success": True,
                "message": "No se encontraron imágenes en el archivo Excel",
                "images": [],
                "count": 0
            }
        
        # Preparar respuesta con imágenes en base64
        image_files = []
        for img_info in images_info:
            try:
                with open(img_info["path"], "rb") as img_file:
                    image_data = base64.b64encode(img_file.read()).decode("utf-8")
                    
                    # Determinar MIME type
                    mime_types = {
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.bmp': 'image/bmp',
                        '.tiff': 'image/tiff',
                        '.svg': 'image/svg+xml'
                    }
                    
                    mime_type = mime_types.get(img_info["extension"], 'image/png')
                    
                    image_files.append({
                        "filename": img_info["filename"],
                        "data": image_data,
                        "mimeType": mime_type,
                        "size": img_info["size"],
                        "extension": img_info["extension"]
                    })
                    
            except Exception as e:
                print(f"Error leyendo imagen {img_info['filename']}: {str(e)}")
                continue
        
        return {
            "success": True,
            "message": f"Se extrajeron {len(image_files)} imágenes correctamente",
            "images": image_files,
            "count": len(image_files)
        }
        
    except Exception as e:
        error_msg = f"Error procesando archivo: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        
        raise HTTPException(status_code=500, detail=error_msg)
        
    finally:
        # Limpiar archivos temporales
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                print(f"Directorio temporal limpiado: {temp_dir}")
            except Exception as e:
                print(f"Error limpiando directorio temporal: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
