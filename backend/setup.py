from setuptools import setup, find_packages

setup(
    name="where2meet-backend",
    version="0.1.0",
    packages=find_packages(),
    python_requires=">=3.11",
    install_requires=[
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0",
        "python-dotenv==1.0.0",
        "httpx==0.24.1",
        "geopy==2.4.0",
        "numpy==1.26.2",
        "pandas==2.1.3",
        "folium==0.15.0",
        "supabase==2.0.2",
        "python-multipart==0.0.6",
    ]
)