#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para crear un archivo Excel de prueba con productos para testing
"""

import pandas as pd
import os

def create_test_excel():
    # Datos de prueba para productos
    data = {
        'CÓDIGO': ['VENT-001', 'VENT-002', 'VENT-003'],
        'UBICACIÓN': ['Sala Principal', 'Cocina', 'Dormitorio 1'],
        'Ancho (m)': [1.20, 0.80, 1.00],
        'Alto (m)': [1.50, 1.20, 1.40],
        'Superficie': [1.80, 0.96, 1.40],
        'Cantidad por Unidad': [1, 1, 2],
        'Superficie Total': [1.80, 0.96, 2.80],
        'Material': ['Aluminio', 'Aluminio', 'PVC'],
        'Tipo Vidrio': ['Templado', 'Laminado', 'Templado'],
        'Color Body': ['Blanco', 'Negro', 'Blanco'],
        'Precio Unitario (USD/m²)': [150.00, 120.00, 100.00],
        'Precio Base (USD)': [270.00, 115.20, 140.00]
    }
    
    # Crear DataFrame
    df = pd.DataFrame(data)
    
    # Guardar el archivo
    filename = 'test-productos-bd.xlsx'
    df.to_excel(filename, index=False)
    
    print(f"✅ Archivo '{filename}' creado exitosamente con {len(df)} productos de prueba")
    print("\nDatos incluidos:")
    print(df.to_string(index=False))
    
    return filename

if __name__ == "__main__":
    create_test_excel()
