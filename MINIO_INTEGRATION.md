# MinIO File Storage Integration

This document describes the MinIO file storage integration added to the Fuelogistics application.

## Overview

MinIO is an S3-compatible object storage server that provides file upload and storage capabilities for the Fuelogistics application. It's configured with a publicly accessible bucket for production use.

## Features

- **File Upload**: Upload images, documents, and other files
- **Public Access**: Files are publicly accessible via direct URLs
- **Multiple File Types**: Supports images (JPG, PNG, GIF, WebP), documents (PDF, DOC, DOCX, XLS, XLSX)
- **File Management**: Create, read, and delete files
- **Integration**: Seamlessly integrated with trips, drivers, and truck management

## Configuration

### Environment Variables

```env
# MinIO Configuration
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=fuelogistics
MINIO_SECRET_KEY=fuelogistics123
MINIO_BUCKET=fuelogistics-files
MINIO_USE_SSL=false
```

### Docker Compose

MinIO is configured in both development and production Docker Compose files:

- **MinIO Server**: Runs on ports 9000 (API) and 9001 (Console)
- **MinIO Init**: Automatically creates and configures the bucket
- **Public Access**: Bucket is configured for public read access

## API Endpoints

### Single File Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: file (FormData)
```

### Multiple Files Upload
```
POST /api/upload/multiple
Content-Type: multipart/form-data
Body: files[] (FormData)
```

### Delete File
```
DELETE /api/files/:fileName
```

### Get File URL
```
GET /api/files/:fileName/url
```

## Usage

### Frontend Component

Use the `FileUpload` component in your React forms:

```tsx
import { FileUpload } from '@/components/file-upload';

<FileUpload
  onUpload={(files) => console.log('Files uploaded:', files)}
  multiple={true}
  maxFiles={5}
  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
  label="Upload Documents"
  description="Upload files related to this item"
/>
```

### Backend Integration

Files are automatically stored in the `fuelogistics-files` bucket and are accessible via public URLs.

## Database Schema

The following models have been updated to support file attachments:

### Trip Model
- `attachments`: Array of file objects with `fileName`, `originalName`, `url`, and `uploadedAt`

### Driver Model
- `photo`: Single file object for driver photo
- `documents`: Array of file objects for driver documents

### Truck Model
- `photo`: Single file object for truck photo
- `documents`: Array of file objects for truck documents

## Security

- Files are stored in a public bucket for easy access
- File types are restricted to safe formats
- File size is limited to 5MB per file
- Maximum 5 files per upload for multiple uploads

## Testing

Run the MinIO integration test:

```bash
./test-minio.sh
```

This script:
1. Starts MinIO service
2. Creates and configures the bucket
3. Tests file upload and public access
4. Cleans up test files

## Deployment

### Development
```bash
docker compose up --build
```

### Production
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Accessing MinIO Console

- **URL**: http://localhost:9001
- **Username**: fuelogistics
- **Password**: fuelogistics123

## File URLs

Uploaded files are accessible via:
```
http://localhost:9000/fuelogistics-files/{filename}
```

In production, replace `localhost:9000` with your actual MinIO server URL.