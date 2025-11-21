# Virtual Assistant API Server Documentation

## Overview

This API server provides a comprehensive backend for a virtual assistant application with features including authentication, user management, chat functionality, model management, knowledge bases, and more. The server uses FastAPI and dynamically loads routers for modular functionality.

The API follows REST principles and uses standard HTTP status codes. All endpoints are prefixed with `/api/v1/` for versioning.

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [User Management Endpoints](#user-management-endpoints)
- [Chat Endpoints](#chat-endpoints)
- [Model Management Endpoints](#model-management-endpoints)
- [Configuration Endpoints](#configuration-endpoints)
- [Pipeline Endpoints](#pipeline-endpoints)
- [Task Endpoints](#task-endpoints)
- [Image Generation Endpoints](#image-generation-endpoints)
- [Audio Processing Endpoints](#audio-processing-endpoints)
- [Retrieval Endpoints](#retrieval-endpoints)
- [Knowledge Base Endpoints](#knowledge-base-endpoints)
- [Prompt Management Endpoints](#prompt-management-endpoints)
- [Tool Management Endpoints](#tool-management-endpoints)
- [Memory Management Endpoints](#memory-management-endpoints)
- [Folder Management Endpoints](#folder-management-endpoints)
- [Group Management Endpoints](#group-management-endpoints)
- [File Management Endpoints](#file-management-endpoints)
- [Function Management Endpoints](#function-management-endpoints)
- [Evaluation Endpoints](#evaluation-endpoints)
- [Utility Endpoints](#utility-endpoints)
- [SCIM Endpoints](#scim-endpoints)

## Authentication Endpoints

### Get Session User
- **Endpoint Path:** `/api/v1/auths/`
- **HTTP Method:** GET
- **Router/Module Name:** `auths`
- **Summary:** Retrieves the current authenticated user's session information
- **Input Parameters:** None
- **Response Example:**
```json
{
  "token": "string",
  "token_type": "Bearer",
  "expires_at": 0,
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "profile_image_url": "string",
  "bio": "string",
  "gender": "string",
  "date_of_birth": "2023-01-01",
  "permissions": {}
}
```
- **Tags:** auths

### Update Profile
- **Endpoint Path:** `/api/v1/auths/update/profile`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Updates the authenticated user's profile information
- **Request Body Example:**
```json
{
  "name": "string",
  "bio": "string",
  "gender": "string",
  "date_of_birth": "2023-01-01",
  "profile_image_url": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "profile_image_url": "string"
}
```
- **Tags:** auths

### Update Password
- **Endpoint Path:** `/api/v1/auths/update/password`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Updates the authenticated user's password
- **Request Body Example:**
```json
{
  "password": "string",
  "new_password": "string"
}
```
- **Response Example:**
```json
true
```
- **Tags:** auths

### LDAP Authentication
- **Endpoint Path:** `/api/v1/auths/ldap`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Authenticates a user via LDAP
- **Request Body Example:**
```json
{
  "user": "string",
  "password": "string"
}
```
- **Response Example:**
```json
{
  "token": "string",
  "token_type": "Bearer",
  "expires_at": 0,
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "profile_image_url": "string",
  "permissions": {}
}
```
- **Tags:** auths

### Sign In
- **Endpoint Path:** `/api/v1/auths/signin`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Authenticates a user and creates a session
- **Request Body Example:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response Example:**
```json
{
  "token": "string",
  "token_type": "Bearer",
  "expires_at": 0,
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "profile_image_url": "string",
  "permissions": {}
}
```
- **Tags:** auths

### Sign Up
- **Endpoint Path:** `/api/v1/auths/signup`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Registers a new user account
- **Request Body Example:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "profile_image_url": "string"
}
```
- **Response Example:**
```json
{
  "token": "string",
  "token_type": "Bearer",
  "expires_at": 0,
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "profile_image_url": "string",
  "permissions": {}
}
```
- **Tags:** auths

### Sign Out
- **Endpoint Path:** `/api/v1/auths/signout`
- **HTTP Method:** GET
- **Router/Module Name:** `auths`
- **Summary:** Signs out the current user and invalidates the session
- **Input Parameters:** None
- **Response Example:**
```json
{
  "status": true
}
```
- **Tags:** auths

### Add User
- **Endpoint Path:** `/api/v1/auths/add`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Adds a new user (admin only)
- **Request Body Example:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "profile_image_url": "string",
  "role": "string"
}
```
- **Response Example:**
```json
{
  "token": "string",
  "token_type": "Bearer",
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "profile_image_url": "string"
}
```
- **Tags:** auths

### Get Admin Details
- **Endpoint Path:** `/api/v1/auths/admin/details`
- **HTTP Method:** GET
- **Router/Module Name:** `auths`
- **Summary:** Retrieves admin contact information
- **Input Parameters:** None
- **Response Example:**
```json
{
  "name": "string",
  "email": "string"
}
```
- **Tags:** auths

### Get Admin Configuration
- **Endpoint Path:** `/api/v1/auths/admin/config`
- **HTTP Method:** GET
- **Router/Module Name:** `auths`
- **Summary:** Retrieves admin configuration settings
- **Input Parameters:** None
- **Response Example:**
```json
{
  "SHOW_ADMIN_DETAILS": true,
  "WEBUI_URL": "string",
  "ENABLE_SIGNUP": true,
  "ENABLE_API_KEY": true,
  "ENABLE_API_KEY_ENDPOINT_RESTRICTIONS": true,
  "API_KEY_ALLOWED_ENDPOINTS": "string",
  "DEFAULT_USER_ROLE": "string",
  "JWT_EXPIRES_IN": "string",
  "ENABLE_COMMUNITY_SHARING": true,
  "ENABLE_MESSAGE_RATING": true,
  "ENABLE_CHANNELS": true,
  "ENABLE_NOTES": true,
  "ENABLE_USER_WEBHOOKS": true,
  "PENDING_USER_OVERLAY_TITLE": "string",
  "PENDING_USER_OVERLAY_CONTENT": "string",
  "RESPONSE_WATERMARK": "string"
}
```
- **Tags:** auths

### Update Admin Configuration
- **Endpoint Path:** `/api/v1/auths/admin/config`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Updates admin configuration settings
- **Request Body Example:**
```json
{
  "SHOW_ADMIN_DETAILS": true,
  "WEBUI_URL": "string",
  "ENABLE_SIGNUP": true,
  "ENABLE_API_KEY": true,
  "ENABLE_API_KEY_ENDPOINT_RESTRICTIONS": true,
  "API_KEY_ALLOWED_ENDPOINTS": "string",
  "DEFAULT_USER_ROLE": "string",
  "JWT_EXPIRES_IN": "string",
  "ENABLE_COMMUNITY_SHARING": true,
  "ENABLE_MESSAGE_RATING": true,
  "ENABLE_CHANNELS": true,
  "ENABLE_NOTES": true,
  "ENABLE_USER_WEBHOOKS": true,
  "PENDING_USER_OVERLAY_TITLE": "string",
  "PENDING_USER_OVERLAY_CONTENT": "string",
  "RESPONSE_WATERMARK": "string"
}
```
- **Response Example:**
```json
{
  "SHOW_ADMIN_DETAILS": true,
  "WEBUI_URL": "string",
  "ENABLE_SIGNUP": true,
  "ENABLE_API_KEY": true,
  "ENABLE_API_KEY_ENDPOINT_RESTRICTIONS": true,
  "API_KEY_ALLOWED_ENDPOINTS": "string",
  "DEFAULT_USER_ROLE": "string",
  "JWT_EXPIRES_IN": "string",
  "ENABLE_COMMUNITY_SHARING": true,
  "ENABLE_MESSAGE_RATING": true,
  "ENABLE_CHANNELS": true,
  "ENABLE_NOTES": true,
  "ENABLE_USER_WEBHOOKS": true,
  "PENDING_USER_OVERLAY_TITLE": "string",
  "PENDING_USER_OVERLAY_CONTENT": "string",
  "RESPONSE_WATERMARK": "string"
}
```
- **Tags:** auths

### Get LDAP Server Configuration
- **Endpoint Path:** `/api/v1/auths/admin/config/ldap/server`
- **HTTP Method:** GET
- **Router/Module Name:** `auths`
- **Summary:** Retrieves LDAP server configuration
- **Input Parameters:** None
- **Response Example:**
```json
{
  "label": "string",
  "host": "string",
  "port": 0,
  "attribute_for_mail": "string",
  "attribute_for_username": "string",
  "app_dn": "string",
  "app_dn_password": "string",
  "search_base": "string",
  "search_filters": "string",
  "use_tls": true,
  "certificate_path": "string",
  "validate_cert": true,
  "ciphers": "string"
}
```
- **Tags:** auths

### Update LDAP Server Configuration
- **Endpoint Path:** `/api/v1/auths/admin/config/ldap/server`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Updates LDAP server configuration
- **Request Body Example:**
```json
{
  "label": "string",
  "host": "string",
  "port": 0,
  "attribute_for_mail": "string",
  "attribute_for_username": "string",
  "app_dn": "string",
  "app_dn_password": "string",
  "search_base": "string",
  "search_filters": "string",
  "use_tls": true,
  "certificate_path": "string",
  "validate_cert": true,
  "ciphers": "string"
}
```
- **Response Example:**
```json
{
  "label": "string",
  "host": "string",
  "port": 0,
  "attribute_for_mail": "string",
  "attribute_for_username": "string",
  "app_dn": "string",
  "app_dn_password": "string",
  "search_base": "string",
  "search_filters": "string",
  "use_tls": true,
  "certificate_path": "string",
  "validate_cert": true,
  "ciphers": "string"
}
```
- **Tags:** auths

### Get LDAP Configuration
- **Endpoint Path:** `/api/v1/auths/admin/config/ldap`
- **HTTP Method:** GET
- **Router/Module Name:** `auths`
- **Summary:** Retrieves LDAP configuration status
- **Input Parameters:** None
- **Response Example:**
```json
{
  "ENABLE_LDAP": true
}
```
- **Tags:** auths

### Update LDAP Configuration
- **Endpoint Path:** `/api/v1/auths/admin/config/ldap`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Updates LDAP configuration status
- **Request Body Example:**
```json
{
  "enable_ldap": true
}
```
- **Response Example:**
```json
{
  "ENABLE_LDAP": true
}
```
- **Tags:** auths

### Generate API Key
- **Endpoint Path:** `/api/v1/auths/api_key`
- **HTTP Method:** POST
- **Router/Module Name:** `auths`
- **Summary:** Generates a new API key for the authenticated user
- **Input Parameters:** None
- **Response Example:**
```json
{
  "api_key": "string"
}
```
- **Tags:** auths

### Delete API Key
- **Endpoint Path:** `/api/v1/auths/api_key`
- **HTTP Method:** DELETE
- **Router/Module Name:** `auths`
- **Summary:** Deletes the API key for the authenticated user
- **Input Parameters:** None
- **Response Example:**
```json
true
```
- **Tags:** auths

### Get API Key
- **Endpoint Path:** `/api/v1/auths/api_key`
- **HTTP Method:** GET
- **Router/Module Name:** `auths`
- **Summary:** Retrieves the API key for the authenticated user
- **Input Parameters:** None
- **Response Example:**
```json
{
  "api_key": "string"
}
```
- **Tags:** auths

## User Management Endpoints

### Get Active Users
- **Endpoint Path:** `/api/v1/users/active`
- **HTTP Method:** GET
- **Router/Module Name:** `users`
- **Summary:** Retrieves a list of currently active users
- **Input Parameters:** None
- **Response Example:**
```json
{
  "user_ids": [
    "string"
  ]
}
```
- **Tags:** users

### Get Users
- **Endpoint Path:** `/api/v1/users/`
- **HTTP Method:** GET
- **Router/Module Name:** `users`
- **Summary:** Retrieves a paginated list of users (admin only)
- **Input Parameters:**
  - query (string, Optional): Search query filter
  - order_by (string, Optional): Field to order results by
  - direction (string, Optional): Sort direction (asc/desc)
  - page (integer, Optional): Page number (default: 1)
- **Response Example:**
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "string",
      "profile_image_url": "string",
      "last_active_at": "2023-01-01T00:00:00",
      "created_at": "2023-01-01T00:00:00",
      "updated_at": "2023-01-01T00:00:00"
    }
  ],
  "total": 0,
  "page": 0,
  "limit": 0
}
```
- **Tags:** users

### Get All Users
- **Endpoint Path:** `/api/v1/users/all`
- **HTTP Method:** GET
- **Router/Module Name:** `users`
- **Summary:** Retrieves all users (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
[
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "profile_image_url": "string",
    "last_active_at": "2023-01-01T00:00:00",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** users

### Search Users
- **Endpoint Path:** `/api/v1/users/search`
- **HTTP Method:** GET
- **Router/Module Name:** `users`
- **Summary:** Searches for users by query
- **Input Parameters:**
  - query (string, Optional): Search query
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string"
  }
]
```
- **Tags:** users

### Get User Groups
- **Endpoint Path:** `/api/v1/users/groups`
- **HTTP Method:** GET
- **Router/Module Name:** `users`
- **Summary:** Retrieves groups the authenticated user belongs to
- **Input Parameters:** None
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "created_by": "string"
  }
]
```
- **Tags:** users

### Get User Permissions
- **Endpoint Path:** `/api/v1/users/permissions`
- **HTTP Method:** GET
- **Router/Module Name:** `users`
- **Summary:** Retrieves permissions for the authenticated user
- **Input Parameters:** None
- **Response Example:**
```json
{
  "workspace": {
    "models": true,
    "knowledge": true,
    "prompts": true,
    "tools": true
  },
  "sharing": {
    "public_models": true,
    "public_knowledge": true,
    "public_prompts": true,
    "public_tools": true,
    "public_notes": true
  },
  "chat": {
    "controls": true,
    "valves": true,
    "system_prompt": true,
    "params": true,
    "file_upload": true,
    "delete": true,
    "delete_message": true,
    "continue_response": true,
    "regenerate_response": true,
    "rate_response": true,
    "edit": true,
    "share": true,
    "export": true,
    "stt": true,
    "tts": true,
    "call": true,
    "multiple_models": true,
    "temporary": true,
    "temporary_enforced": false
  },
  "features": {
    "direct_tool_servers": false,
    "web_search": true,
    "image_generation": true,
    "code_interpreter": true,
    "notes": true
  }
}
```
- **Tags:** users

### Get Default User Permissions
- **Endpoint Path:** `/api/v1/users/default/permissions`
- **HTTP Method:** GET
- **Router/Module Name:** `users`
- **Summary:** Retrieves default user permissions
- **Input Parameters:** None
- **Response Example:**
```json
{
  "workspace": {
    "models": true,
    "knowledge": true,
    "prompts": true,
    "tools": true
  },
  "sharing": {
    "public_models": true,
    "public_knowledge": true,
    "public_prompts": true,
    "public_tools": true,
    "public_notes": true
  },
  "chat": {
    "controls": true,
    "valves": true,
    "system_prompt": true,
    "params": true,
    "file_upload": true,
    "delete": true,
    "delete_message": true,
    "continue_response": true,
    "regenerate_response": true,
    "rate_response": true,
    "edit": true,
    "share": true,
    "export": true,
    "stt": true,
    "tts": true,
    "call": true,
    "multiple_models": true,
    "temporary": true,
    "temporary_enforced": false
  },
  "features": {
    "direct_tool_servers": false,
    "web_search": true,
    "image_generation": true,
    "code_interpreter": true,
    "notes": true
  }
}
```
- **Tags:** users

## Chat Endpoints

### Get Chat List
- **Endpoint Path:** `/api/v1/chats/`
- **HTTP Method:** GET
- **Router/Module Name:** `chats`
- **Summary:** Retrieves the authenticated user's chat list
- **Input Parameters:**
  - page (integer, Optional): Page number
  - include_folders (boolean, Optional): Include folders in results
- **Response Example:**
```json
[
  {
    "id": "string",
    "title": "string",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** chats

### Delete All User Chats
- **Endpoint Path:** `/api/v1/chats/`
- **HTTP Method:** DELETE
- **Router/Module Name:** `chats`
- **Summary:** Deletes all chats for the authenticated user
- **Input Parameters:** None
- **Response Example:**
```json
true
```
- **Tags:** chats

### Get User Chat List by User ID
- **Endpoint Path:** `/api/v1/chats/list/user/{user_id}`
- **HTTP Method:** GET
- **Router/Module Name:** `chats`
- **Summary:** Retrieves chat list for a specific user (admin only)
- **Input Parameters:**
  - user_id (string): ID of the user
  - page (integer, Optional): Page number
  - query (string, Optional): Search query
  - order_by (string, Optional): Field to order by
  - direction (string, Optional): Sort direction
- **Response Example:**
```json
[
  {
    "id": "string",
    "title": "string",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** chats

### Create New Chat
- **Endpoint Path:** `/api/v1/chats/new`
- **HTTP Method:** POST
- **Router/Module Name:** `chats`
- **Summary:** Creates a new chat
- **Request Body Example:**
```json
{
  "title": "string",
  "folder_id": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "user_id": "string",
  "title": "string",
  "chat": {},
  "folder_id": "string",
  "archived": false,
  "archived_at": "2023-01-01T00:00:00",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** chats

### Import Chat
- **Endpoint Path:** `/api/v1/chats/import`
- **HTTP Method:** POST
- **Router/Module Name:** `chats`
- **Summary:** Imports a chat
- **Request Body Example:**
```json
{
  "id": "string",
  "title": "string",
  "folder_id": "string",
  "chat": {}
}
```
- **Response Example:**
```json
{
  "id": "string",
  "user_id": "string",
  "title": "string",
  "chat": {},
  "folder_id": "string",
  "archived": false,
  "archived_at": "2023-01-01T00:00:00",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** chats

### Search User Chats
- **Endpoint Path:** `/api/v1/chats/search`
- **HTTP Method:** GET
- **Router/Module Name:** `chats`
- **Summary:** Searches user chats by text
- **Input Parameters:**
  - text (string): Search text
  - page (integer, Optional): Page number
- **Response Example:**
```json
[
  {
    "id": "string",
    "title": "string",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** chats

## Model Management Endpoints

### Get Models
- **Endpoint Path:** `/api/v1/models/`
- **HTTP Method:** GET
- **Router/Module Name:** `models`
- **Summary:** Retrieves models accessible to the authenticated user
- **Input Parameters:**
  - id (string, Optional): Filter by model ID
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "meta": {
      "profile_image_url": "string",
      "description": "string",
      "tags": [
        {
          "name": "string"
        }
      ]
    },
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00",
    "is_active": true
  }
]
```
- **Tags:** models

### Get Base Models
- **Endpoint Path:** `/api/v1/models/base`
- **HTTP Method:** GET
- **Router/Module Name:** `models`
- **Summary:** Retrieves base models (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "meta": {
      "profile_image_url": "string",
      "description": "string",
      "tags": [
        {
          "name": "string"
        }
      ]
    },
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** models

### Create New Model
- **Endpoint Path:** `/api/v1/models/create`
- **HTTP Method:** POST
- **Router/Module Name:** `models`
- **Summary:** Creates a new model
- **Request Body Example:**
```json
{
  "id": "string",
  "name": "string",
  "meta": {
    "profile_image_url": "string",
    "description": "string"
  },
  "params": {}
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "meta": {
    "profile_image_url": "string",
    "description": "string",
    "tags": [
      {
        "name": "string"
      }
    ]
  },
  "params": {},
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00",
  "is_active": true
}
```
- **Tags:** models

### Export Models
- **Endpoint Path:** `/api/v1/models/export`
- **HTTP Method:** GET
- **Router/Module Name:** `models`
- **Summary:** Exports all models (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "meta": {
      "profile_image_url": "string",
      "description": "string",
      "tags": [
        {
          "name": "string"
        }
      ]
    },
    "params": {},
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00",
    "is_active": true
  }
]
```
- **Tags:** models

### Import Models
- **Endpoint Path:** `/api/v1/models/import`
- **HTTP Method:** POST
- **Router/Module Name:** `models`
- **Summary:** Imports models (admin only)
- **Request Body Example:**
```json
{
  "models": [
    {}
  ]
}
```
- **Response Example:**
```json
true
```
- **Tags:** models

### Sync Models
- **Endpoint Path:** `/api/v1/models/sync`
- **HTTP Method:** POST
- **Router/Module Name:** `models`
- **Summary:** Synchronizes models (admin only)
- **Request Body Example:**
```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "meta": {
        "profile_image_url": "string",
        "description": "string",
        "tags": [
          {
            "name": "string"
          }
        ]
      },
      "params": {},
      "created_at": "2023-01-01T00:00:00",
      "updated_at": "2023-01-01T00:00:00",
      "is_active": true
    }
  ]
}
```
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "meta": {
      "profile_image_url": "string",
      "description": "string",
      "tags": [
        {
          "name": "string"
        }
      ]
    },
    "params": {},
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00",
    "is_active": true
  }
]
```
- **Tags:** models

### Get Model by ID
- **Endpoint Path:** `/api/v1/models/model`
- **HTTP Method:** GET
- **Router/Module Name:** `models`
- **Summary:** Retrieves a specific model by ID
- **Input Parameters:**
  - id (string): Model ID
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "meta": {
    "profile_image_url": "string",
    "description": "string",
    "tags": [
      {
        "name": "string"
      }
    ]
  },
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** models

## Configuration Endpoints

### Import Configuration
- **Endpoint Path:** `/api/v1/configs/import`
- **HTTP Method:** POST
- **Router/Module Name:** `configs`
- **Summary:** Imports application configuration (admin only)
- **Request Body Example:**
```json
{
  "config": {}
}
```
- **Response Example:**
```json
{}
```
- **Tags:** configs

### Export Configuration
- **Endpoint Path:** `/api/v1/configs/export`
- **HTTP Method:** GET
- **Router/Module Name:** `configs`
- **Summary:** Exports application configuration (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
{}
```
- **Tags:** configs

### Get Connections Configuration
- **Endpoint Path:** `/api/v1/configs/connections`
- **HTTP Method:** GET
- **Router/Module Name:** `configs`
- **Summary:** Retrieves connections configuration (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
{
  "ENABLE_DIRECT_CONNECTIONS": true,
  "ENABLE_BASE_MODELS_CACHE": true
}
```
- **Tags:** configs

### Set Connections Configuration
- **Endpoint Path:** `/api/v1/configs/connections`
- **HTTP Method:** POST
- **Router/Module Name:** `configs`
- **Summary:** Updates connections configuration (admin only)
- **Request Body Example:**
```json
{
  "ENABLE_DIRECT_CONNECTIONS": true,
  "ENABLE_BASE_MODELS_CACHE": true
}
```
- **Response Example:**
```json
{
  "ENABLE_DIRECT_CONNECTIONS": true,
  "ENABLE_BASE_MODELS_CACHE": true
}
```
- **Tags:** configs

### Register OAuth Client
- **Endpoint Path:** `/api/v1/configs/oauth/clients/register`
- **HTTP Method:** POST
- **Router/Module Name:** `configs`
- **Summary:** Registers an OAuth client (admin only)
- **Request Body Example:**
```json
{
  "url": "string",
  "client_id": "string",
  "client_name": "string"
}
```
- **Response Example:**
```json
{
  "status": true,
  "oauth_client_info": "string"
}
```
- **Tags:** configs

### Get Tool Servers Configuration
- **Endpoint Path:** `/api/v1/configs/tool_servers`
- **HTTP Method:** GET
- **Router/Module Name:** `configs`
- **Summary:** Retrieves tool servers configuration (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
{
  "TOOL_SERVER_CONNECTIONS": [
    {
      "url": "string",
      "path": "string",
      "type": "string",
      "auth_type": "string",
      "key": "string",
      "config": {}
    }
  ]
}
```
- **Tags:** configs

### Set Tool Servers Configuration
- **Endpoint Path:** `/api/v1/configs/tool_servers`
- **HTTP Method:** POST
- **Router/Module Name:** `configs`
- **Summary:** Updates tool servers configuration (admin only)
- **Request Body Example:**
```json
{
  "TOOL_SERVER_CONNECTIONS": [
    {
      "url": "string",
      "path": "string",
      "type": "string",
      "auth_type": "string",
      "key": "string",
      "config": {}
    }
  ]
}
```
- **Response Example:**
```json
{
  "TOOL_SERVER_CONNECTIONS": [
    {
      "url": "string",
      "path": "string",
      "type": "string",
      "auth_type": "string",
      "key": "string",
      "config": {}
    }
  ]
}
```
- **Tags:** configs

### Verify Tool Servers Configuration
- **Endpoint Path:** `/api/v1/configs/tool_servers/verify`
- **HTTP Method:** POST
- **Router/Module Name:** `configs`
- **Summary:** Verifies tool servers configuration (admin only)
- **Request Body Example:**
```json
{
  "TOOL_SERVER_CONNECTIONS": [
    {
      "url": "string",
      "path": "string",
      "type": "string",
      "auth_type": "string",
      "key": "string",
      "config": {}
    }
  ]
}
```
- **Response Example:**
```json
{
  "status": true
}
```
- **Tags:** configs

## Pipeline Endpoints

### Get Pipelines
- **Endpoint Path:** `/api/v1/pipelines/`
- **HTTP Method:** GET
- **Router/Module Name:** `pipelines`
- **Summary:** Retrieves pipelines
- **Input Parameters:** None
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "pipelines": [
      "string"
    ],
    "priority": 0,
    "valves": {},
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** pipelines

### Get Pipeline by ID
- **Endpoint Path:** `/api/v1/pipelines/{id}`
- **HTTP Method:** GET
- **Router/Module Name:** `pipelines`
- **Summary:** Retrieves a specific pipeline by ID
- **Input Parameters:**
  - id (string): Pipeline ID
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "pipelines": [
    "string"
  ],
  "priority": 0,
  "valves": {},
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** pipelines

### Create New Pipeline
- **Endpoint Path:** `/api/v1/pipelines/create`
- **HTTP Method:** POST
- **Router/Module Name:** `pipelines`
- **Summary:** Creates a new pipeline
- **Request Body Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "pipelines": [
    "string"
  ],
  "priority": 0,
  "valves": {}
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "pipelines": [
    "string"
  ],
  "priority": 0,
  "valves": {},
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** pipelines

### Update Pipeline by ID
- **Endpoint Path:** `/api/v1/pipelines/{id}`
- **HTTP Method:** POST
- **Router/Module Name:** `pipelines`
- **Summary:** Updates a specific pipeline by ID
- **Input Parameters:**
  - id (string): Pipeline ID
- **Request Body Example:**
```json
{
  "name": "string",
  "description": "string",
  "type": "string",
  "pipelines": [
    "string"
  ],
  "priority": 0,
  "valves": {}
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "pipelines": [
    "string"
  ],
  "priority": 0,
  "valves": {},
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** pipelines

### Delete Pipeline by ID
- **Endpoint Path:** `/api/v1/pipelines/{id}`
- **HTTP Method:** DELETE
- **Router/Module Name:** `pipelines`
- **Summary:** Deletes a specific pipeline by ID
- **Input Parameters:**
  - id (string): Pipeline ID
- **Response Example:**
```json
true
```
- **Tags:** pipelines

### Get Pipeline Valves
- **Endpoint Path:** `/api/v1/pipelines/{id}/valves`
- **HTTP Method:** GET
- **Router/Module Name:** `pipelines`
- **Summary:** Retrieves valves for a specific pipeline
- **Input Parameters:**
  - id (string): Pipeline ID
- **Response Example:**
```json
{}
```
- **Tags:** pipelines

### Update Pipeline Valves
- **Endpoint Path:** `/api/v1/pipelines/{id}/valves`
- **HTTP Method:** POST
- **Router/Module Name:** `pipelines`
- **Summary:** Updates valves for a specific pipeline
- **Input Parameters:**
  - id (string): Pipeline ID
- **Request Body Example:**
```json
{}
```
- **Response Example:**
```json
{}
```
- **Tags:** pipelines

## Task Endpoints

### Get Task Configuration
- **Endpoint Path:** `/api/v1/tasks/config`
- **HTTP Method:** GET
- **Router/Module Name:** `tasks`
- **Summary:** Retrieves task configuration
- **Input Parameters:** None
- **Response Example:**
```json
{
  "TASK_MODEL": "string",
  "TASK_MODEL_EXTERNAL": {},
  "TITLE_GENERATION_PROMPT_TEMPLATE": "string",
  "IMAGE_PROMPT_GENERATION_PROMPT_TEMPLATE": "string",
  "ENABLE_AUTOCOMPLETE_GENERATION": true,
  "AUTOCOMPLETE_GENERATION_INPUT_MAX_LENGTH": 0,
  "TAGS_GENERATION_PROMPT_TEMPLATE": "string",
  "FOLLOW_UP_GENERATION_PROMPT_TEMPLATE": "string",
  "ENABLE_FOLLOW_UP_GENERATION": true,
  "ENABLE_TAGS_GENERATION": true
}
```
- **Tags:** tasks

### Update Task Configuration
- **Endpoint Path:** `/api/v1/tasks/config`
- **HTTP Method:** POST
- **Router/Module Name:** `tasks`
- **Summary:** Updates task configuration (admin only)
- **Request Body Example:**
```json
{
  "TASK_MODEL": "string",
  "TASK_MODEL_EXTERNAL": {},
  "TITLE_GENERATION_PROMPT_TEMPLATE": "string",
  "IMAGE_PROMPT_GENERATION_PROMPT_TEMPLATE": "string",
  "ENABLE_AUTOCOMPLETE_GENERATION": true,
  "AUTOCOMPLETE_GENERATION_INPUT_MAX_LENGTH": 0,
  "TAGS_GENERATION_PROMPT_TEMPLATE": "string",
  "FOLLOW_UP_GENERATION_PROMPT_TEMPLATE": "string",
  "ENABLE_FOLLOW_UP_GENERATION": true,
  "ENABLE_TAGS_GENERATION": true
}
```
- **Response Example:**
```json
{
  "TASK_MODEL": "string",
  "TASK_MODEL_EXTERNAL": {},
  "TITLE_GENERATION_PROMPT_TEMPLATE": "string",
  "IMAGE_PROMPT_GENERATION_PROMPT_TEMPLATE": "string",
  "ENABLE_AUTOCOMPLETE_GENERATION": true,
  "AUTOCOMPLETE_GENERATION_INPUT_MAX_LENGTH": 0,
  "TAGS_GENERATION_PROMPT_TEMPLATE": "string",
  "FOLLOW_UP_GENERATION_PROMPT_TEMPLATE": "string",
  "ENABLE_FOLLOW_UP_GENERATION": true,
  "ENABLE_TAGS_GENERATION": true
}
```
- **Tags:** tasks

### Stop Task
- **Endpoint Path:** `/api/v1/tasks/stop/{task_id}`
- **HTTP Method:** POST
- **Router/Module Name:** `tasks`
- **Summary:** Stops a specific task
- **Input Parameters:**
  - task_id (string): ID of the task to stop
- **Response Example:**
```json
{
  "status": true
}
```
- **Tags:** tasks

### List Tasks
- **Endpoint Path:** `/api/v1/tasks/`
- **HTTP Method:** GET
- **Router/Module Name:** `tasks`
- **Summary:** Lists all tasks
- **Input Parameters:** None
- **Response Example:**
```json
{
  "tasks": [
    {
      "id": "string",
      "status": "string",
      "created_at": "2023-01-01T00:00:00",
      "updated_at": "2023-01-01T00:00:00"
    }
  ]
}
```
- **Tags:** tasks

### List Tasks by Chat ID
- **Endpoint Path:** `/api/v1/tasks/chat/{chat_id}`
- **HTTP Method:** GET
- **Router/Module Name:** `tasks`
- **Summary:** Lists tasks associated with a specific chat
- **Input Parameters:**
  - chat_id (string): ID of the chat
- **Response Example:**
```json
{
  "task_ids": [
    "string"
  ]
}
```
- **Tags:** tasks

## Image Generation Endpoints

### Get Image Generation Configuration
- **Endpoint Path:** `/api/v1/images/config`
- **HTTP Method:** GET
- **Router/Module Name:** `images`
- **Summary:** Retrieves image generation configuration
- **Input Parameters:** None
- **Response Example:**
```json
{
  "IMAGE_GENERATION_ENGINE": "string",
  "ENABLE_IMAGE_GENERATION": true,
  "AUTOMATIC1111_BASE_URL": "string",
  "AUTOMATIC1111_API_AUTH": "string",
  "COMFYUI_BASE_URL": "string",
  "COMFYUI_API_KEY": "string",
  "IMAGES_OPENAI_API_BASE_URL": "string",
  "IMAGES_OPENAI_API_KEY": "string",
  "IMAGES_GEMINI_API_BASE_URL": "string",
  "IMAGES_GEMINI_API_KEY": "string",
  "IMAGE_SIZE": "string",
  "IMAGE_STEPS": "string",
  "IMAGE_GENERATION_MODEL": "string",
  "ENABLE_IMAGE_PROMPT_GENERATION": true
}
```
- **Tags:** images

### Update Image Generation Configuration
- **Endpoint Path:** `/api/v1/images/config`
- **HTTP Method:** POST
- **Router/Module Name:** `images`
- **Summary:** Updates image generation configuration (admin only)
- **Request Body Example:**
```json
{
  "IMAGE_GENERATION_ENGINE": "string",
  "ENABLE_IMAGE_GENERATION": true,
  "AUTOMATIC1111_BASE_URL": "string",
  "AUTOMATIC1111_API_AUTH": "string",
  "COMFYUI_BASE_URL": "string",
  "COMFYUI_API_KEY": "string",
  "IMAGES_OPENAI_API_BASE_URL": "string",
  "IMAGES_OPENAI_API_KEY": "string",
  "IMAGES_GEMINI_API_BASE_URL": "string",
  "IMAGES_GEMINI_API_KEY": "string",
  "IMAGE_SIZE": "string",
  "IMAGE_STEPS": "string",
  "IMAGE_GENERATION_MODEL": "string",
  "ENABLE_IMAGE_PROMPT_GENERATION": true
}
```
- **Response Example:**
```json
{
  "IMAGE_GENERATION_ENGINE": "string",
  "ENABLE_IMAGE_GENERATION": true,
  "AUTOMATIC1111_BASE_URL": "string",
  "AUTOMATIC1111_API_AUTH": "string",
  "COMFYUI_BASE_URL": "string",
  "COMFYUI_API_KEY": "string",
  "IMAGES_OPENAI_API_BASE_URL": "string",
  "IMAGES_OPENAI_API_KEY": "string",
  "IMAGES_GEMINI_API_BASE_URL": "string",
  "IMAGES_GEMINI_API_KEY": "string",
  "IMAGE_SIZE": "string",
  "IMAGE_STEPS": "string",
  "IMAGE_GENERATION_MODEL": "string",
  "ENABLE_IMAGE_PROMPT_GENERATION": true
}
```
- **Tags:** images

### Generate Images
- **Endpoint Path:** `/api/v1/images/generations`
- **HTTP Method:** POST
- **Router/Module Name:** `images`
- **Summary:** Generates images based on a prompt
- **Request Body Example:**
```json
{
  "model": "string",
  "prompt": "string",
  "n": 0,
  "size": "string",
  "quality": "string"
}
```
- **Response Example:**
```json
{
  "data": [
    {
      "url": "string",
      "b64_json": "string"
    }
  ]
}
```
- **Tags:** images

## Audio Processing Endpoints

### Get Audio Configuration
- **Endpoint Path:** `/api/v1/audio/config`
- **HTTP Method:** GET
- **Router/Module Name:** `audio`
- **Summary:** Retrieves audio processing configuration
- **Input Parameters:** None
- **Response Example:**
```json
{
  "stt": {
    "engine": "string",
    "model": "string"
  },
  "tts": {
    "engine": "string",
    "voice": "string",
    "split_on": "string"
  }
}
```
- **Tags:** audio

### Update Audio Configuration
- **Endpoint Path:** `/api/v1/audio/config`
- **HTTP Method:** POST
- **Router/Module Name:** `audio`
- **Summary:** Updates audio processing configuration (admin only)
- **Request Body Example:**
```json
{
  "STT_ENGINE": "string",
  "STT_MODEL": "string",
  "TTS_ENGINE": "string",
  "TTS_MODEL": "string",
  "TTS_VOICE": "string",
  "TTS_SPLIT_ON": "string"
}
```
- **Response Example:**
```json
{
  "STT_ENGINE": "string",
  "STT_MODEL": "string",
  "TTS_ENGINE": "string",
  "TTS_MODEL": "string",
  "TTS_VOICE": "string",
  "TTS_SPLIT_ON": "string"
}
```
- **Tags:** audio

### Speech to Text
- **Endpoint Path:** `/api/v1/audio/speech-to-text`
- **HTTP Method:** POST
- **Router/Module Name:** `audio`
- **Summary:** Converts speech to text
- **Request Body Example:**
```json
{
  "model": "string",
  "file": "string",
  "language": "string",
  "prompt": "string",
  "response_format": "string",
  "temperature": 0
}
```
- **Response Example:**
```json
{
  "text": "string"
}
```
- **Tags:** audio

### Text to Speech
- **Endpoint Path:** `/api/v1/audio/text-to-speech`
- **HTTP Method:** POST
- **Router/Module Name:** `audio`
- **Summary:** Converts text to speech
- **Request Body Example:**
```json
{
  "model": "string",
  "input": "string",
  "voice": "string",
  "response_format": "string",
  "speed": 0
}
```
- **Response Example:**
```json
{
  "url": "string",
  "b64_json": "string"
}
```
- **Tags:** audio

## Retrieval Endpoints

### Get Retrieval Status
- **Endpoint Path:** `/api/v1/retrieval/`
- **HTTP Method:** GET
- **Router/Module Name:** `retrieval`
- **Summary:** Retrieves retrieval system status
- **Input Parameters:** None
- **Response Example:**
```json
{
  "status": true,
  "chunk_size": 0,
  "chunk_overlap": 0,
  "template": "string",
  "embedding_engine": "string",
  "embedding_model": "string",
  "reranking_model": "string",
  "embedding_batch_size": 0
}
```
- **Tags:** retrieval

### Get Embedding Configuration
- **Endpoint Path:** `/api/v1/retrieval/embedding`
- **HTTP Method:** GET
- **Router/Module Name:** `retrieval`
- **Summary:** Retrieves embedding configuration (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
{
  "status": true,
  "embedding_engine": "string",
  "embedding_model": "string",
  "embedding_batch_size": 0,
  "openai_config": {},
  "azure_openai_config": {},
  "ollama_config": {}
}
```
- **Tags:** retrieval

### Update Embedding Configuration
- **Endpoint Path:** `/api/v1/retrieval/embedding`
- **HTTP Method:** POST
- **Router/Module Name:** `retrieval`
- **Summary:** Updates embedding configuration (admin only)
- **Request Body Example:**
```json
{
  "embedding_engine": "string",
  "embedding_model": "string",
  "embedding_batch_size": 0,
  "openai_config": {},
  "azure_openai_config": {},
  "ollama_config": {}
}
```
- **Response Example:**
```json
{
  "status": true,
  "embedding_engine": "string",
  "embedding_model": "string",
  "embedding_batch_size": 0,
  "openai_config": {},
  "azure_openai_config": {},
  "ollama_config": {}
}
```
- **Tags:** retrieval

### Get Reranking Configuration
- **Endpoint Path:** `/api/v1/retrieval/reranking`
- **HTTP Method:** GET
- **Router/Module Name:** `retrieval`
- **Summary:** Retrieves reranking configuration (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
{
  "status": true,
  "reranking_engine": "string",
  "reranking_model": "string",
  "external_reranker_url": "string",
  "external_reranker_api_key": "string"
}
```
- **Tags:** retrieval

### Update Reranking Configuration
- **Endpoint Path:** `/api/v1/retrieval/reranking`
- **HTTP Method:** POST
- **Router/Module Name:** `retrieval`
- **Summary:** Updates reranking configuration (admin only)
- **Request Body Example:**
```json
{
  "reranking_engine": "string",
  "reranking_model": "string",
  "external_reranker_url": "string",
  "external_reranker_api_key": "string"
}
```
- **Response Example:**
```json
{
  "status": true,
  "reranking_engine": "string",
  "reranking_model": "string",
  "external_reranker_url": "string",
  "external_reranker_api_key": "string"
}
```
- **Tags:** retrieval

### Get Retrieval Configuration
- **Endpoint Path:** `/api/v1/retrieval/config`
- **HTTP Method:** GET
- **Router/Module Name:** `retrieval`
- **Summary:** Retrieves retrieval configuration (admin only)
- **Input Parameters:** None
- **Response Example:**
```json
{
  "status": true,
  "RAG_TEMPLATE": "string",
  "TOP_K": 0,
  "BYPASS_EMBEDDING_AND_RETRIEVAL": true,
  "RAG_FULL_CONTEXT": true,
  "ENABLE_RAG_HYBRID_SEARCH": true,
  "TOP_K_RERANKER": 0,
  "RELEVANCE_THRESHOLD": 0,
  "HYBRID_BM25_WEIGHT": 0,
  "CONTENT_EXTRACTION_ENGINE": "string",
  "PDF_EXTRACT_IMAGES": true,
  "DATALAB_MARKER_API_KEY": "string",
  "DATALAB_MARKER_API_BASE_URL": "string",
  "DATALAB_MARKER_ADDITIONAL_CONFIG": {}
}
```
- **Tags:** retrieval

### Update Retrieval Configuration
- **Endpoint Path:** `/api/v1/retrieval/config`
- **HTTP Method:** POST
- **Router/Module Name:** `retrieval`
- **Summary:** Updates retrieval configuration (admin only)
- **Request Body Example:**
```json
{
  "RAG_TEMPLATE": "string",
  "TOP_K": 0,
  "BYPASS_EMBEDDING_AND_RETRIEVAL": true,
  "RAG_FULL_CONTEXT": true,
  "ENABLE_RAG_HYBRID_SEARCH": true,
  "TOP_K_RERANKER": 0,
  "RELEVANCE_THRESHOLD": 0,
  "HYBRID_BM25_WEIGHT": 0,
  "CONTENT_EXTRACTION_ENGINE": "string",
  "PDF_EXTRACT_IMAGES": true,
  "DATALAB_MARKER_API_KEY": "string",
  "DATALAB_MARKER_API_BASE_URL": "string",
  "DATALAB_MARKER_ADDITIONAL_CONFIG": {}
}
```
- **Response Example:**
```json
{
  "status": true,
  "RAG_TEMPLATE": "string",
  "TOP_K": 0,
  "BYPASS_EMBEDDING_AND_RETRIEVAL": true,
  "RAG_FULL_CONTEXT": true,
  "ENABLE_RAG_HYBRID_SEARCH": true,
  "TOP_K_RERANKER": 0,
  "RELEVANCE_THRESHOLD": 0,
  "HYBRID_BM25_WEIGHT": 0,
  "CONTENT_EXTRACTION_ENGINE": "string",
  "PDF_EXTRACT_IMAGES": true,
  "DATALAB_MARKER_API_KEY": "string",
  "DATALAB_MARKER_API_BASE_URL": "string",
  "DATALAB_MARKER_ADDITIONAL_CONFIG": {}
}
```
- **Tags:** retrieval

### Query Collection
- **Endpoint Path:** `/api/v1/retrieval/query`
- **HTTP Method:** POST
- **Router/Module Name:** `retrieval`
- **Summary:** Queries a collection
- **Request Body Example:**
```json
{
  "collection_name": "string",
  "query": "string",
  "k": 0
}
```
- **Response Example:**
```json
[
  {
    "metadata": {},
    "content": "string",
    "distance": 0
  }
]
```
- **Tags:** retrieval

### Search
- **Endpoint Path:** `/api/v1/retrieval/search`
- **HTTP Method:** POST
- **Router/Module Name:** `retrieval`
- **Summary:** Performs a search
- **Request Body Example:**
```json
{
  "queries": [
    "string"
  ]
}
```
- **Response Example:**
```json
[
  {
    "query": "string",
    "results": [
      {
        "metadata": {},
        "content": "string",
        "distance": 0
      }
    ]
  }
]
```
- **Tags:** retrieval

### Web Search
- **Endpoint Path:** `/api/v1/retrieval/web/search`
- **HTTP Method:** POST
- **Router/Module Name:** `retrieval`
- **Summary:** Performs a web search
- **Request Body Example:**
```json
{
  "queries": [
    "string"
  ]
}
```
- **Response Example:**
```json
[
  {
    "query": "string",
    "results": [
      {
        "url": "string",
        "title": "string",
        "content": "string"
      }
    ]
  }
]
```
- **Tags:** retrieval

## Knowledge Base Endpoints

### Get Knowledge
- **Endpoint Path:** `/api/v1/knowledge/`
- **HTTP Method:** GET
- **Router/Module Name:** `knowledge`
- **Summary:** Retrieves knowledge entries
- **Input Parameters:**
  - limit (integer, Optional): Number of entries to retrieve
  - offset (integer, Optional): Offset for pagination
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "data": {},
    "user_id": "string",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** knowledge

### Create Knowledge
- **Endpoint Path:** `/api/v1/knowledge/create`
- **HTTP Method:** POST
- **Router/Module Name:** `knowledge`
- **Summary:** Creates a new knowledge entry
- **Request Body Example:**
```json
{
  "name": "string",
  "description": "string",
  "data": {}
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "data": {},
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** knowledge

### Get Knowledge by ID
- **Endpoint Path:** `/api/v1/knowledge/{id}`
- **HTTP Method:** GET
- **Router/Module Name:** `knowledge`
- **Summary:** Retrieves a specific knowledge entry by ID
- **Input Parameters:**
  - id (string): Knowledge entry ID
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "data": {},
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** knowledge

### Update Knowledge by ID
- **Endpoint Path:** `/api/v1/knowledge/{id}`
- **HTTP Method:** POST
- **Router/Module Name:** `knowledge`
- **Summary:** Updates a specific knowledge entry by ID
- **Input Parameters:**
  - id (string): Knowledge entry ID
- **Request Body Example:**
```json
{
  "name": "string",
  "description": "string",
  "data": {}
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "data": {},
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** knowledge

### Delete Knowledge by ID
- **Endpoint Path:** `/api/v1/knowledge/{id}`
- **HTTP Method:** DELETE
- **Router/Module Name:** `knowledge`
- **Summary:** Deletes a specific knowledge entry by ID
- **Input Parameters:**
  - id (string): Knowledge entry ID
- **Response Example:**
```json
true
```
- **Tags:** knowledge

### Get Knowledge Session
- **Endpoint Path:** `/api/v1/knowledge/session/{id}`
- **HTTP Method:** GET
- **Router/Module Name:** `knowledge`
- **Summary:** Retrieves a knowledge session by ID
- **Input Parameters:**
  - id (string): Session ID
- **Response Example:**
```json
{
  "id": "string",
  "user_id": "string",
  "name": "string",
  "description": "string",
  "data": {},
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** knowledge

## Prompt Management Endpoints

### Get Prompts
- **Endpoint Path:** `/api/v1/prompts/`
- **HTTP Method:** GET
- **Router/Module Name:** `prompts`
- **Summary:** Retrieves prompts
- **Input Parameters:**
  - skip (integer, Optional): Number of entries to skip
  - limit (integer, Optional): Number of entries to retrieve
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "content": "string",
    "user_id": "string",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** prompts

### Create Prompt
- **Endpoint Path:** `/api/v1/prompts/create`
- **HTTP Method:** POST
- **Router/Module Name:** `prompts`
- **Summary:** Creates a new prompt
- **Request Body Example:**
```json
{
  "name": "string",
  "content": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** prompts

### Get Prompt by ID
- **Endpoint Path:** `/api/v1/prompts/{id}`
- **HTTP Method:** GET
- **Router/Module Name:** `prompts`
- **Summary:** Retrieves a specific prompt by ID
- **Input Parameters:**
  - id (string): Prompt ID
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** prompts

### Update Prompt by ID
- **Endpoint Path:** `/api/v1/prompts/{id}`
- **HTTP Method:** POST
- **Router/Module Name:** `prompts`
- **Summary:** Updates a specific prompt by ID
- **Input Parameters:**
  - id (string): Prompt ID
- **Request Body Example:**
```json
{
  "name": "string",
  "content": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** prompts

### Delete Prompt by ID
- **Endpoint Path:** `/api/v1/prompts/{id}`
- **HTTP Method:** DELETE
- **Router/Module Name:** `prompts`
- **Summary:** Deletes a specific prompt by ID
- **Input Parameters:**
  - id (string): Prompt ID
- **Response Example:**
```json
true
```
- **Tags:** prompts

## Tool Management Endpoints

### Get Tools
- **Endpoint Path:** `/api/v1/tools/`
- **HTTP Method:** GET
- **Router/Module Name:** `tools`
- **Summary:** Retrieves tools
- **Input Parameters:** None
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "category": "string",
    "content": "string",
    "user_id": "string",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** tools

### Create Tool
- **Endpoint Path:** `/api/v1/tools/create`
- **HTTP Method:** POST
- **Router/Module Name:** `tools`
- **Summary:** Creates a new tool
- **Request Body Example:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "content": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** tools

### Get Tool by ID
- **Endpoint Path:** `/api/v1/tools/{id}`
- **HTTP Method:** GET
- **Router/Module Name:** `tools`
- **Summary:** Retrieves a specific tool by ID
- **Input Parameters:**
  - id (string): Tool ID
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** tools

### Update Tool by ID
- **Endpoint Path:** `/api/v1/tools/{id}`
- **HTTP Method:** POST
- **Router/Module Name:** `tools`
- **Summary:** Updates a specific tool by ID
- **Input Parameters:**
  - id (string): Tool ID
- **Request Body Example:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "content": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** tools

### Delete Tool by ID
- **Endpoint Path:** `/api/v1/tools/{id}`
- **HTTP Method:** DELETE
- **Router/Module Name:** `tools`
- **Summary:** Deletes a specific tool by ID
- **Input Parameters:**
  - id (string): Tool ID
- **Response Example:**
```json
true
```
- **Tags:** tools

## Memory Management Endpoints

### Get Memories
- **Endpoint Path:** `/api/v1/memories/`
- **HTTP Method:** GET
- **Router/Module Name:** `memories`
- **Summary:** Retrieves memories
- **Input Parameters:**
  - skip (integer, Optional): Number of entries to skip
  - limit (integer, Optional): Number of entries to retrieve
- **Response Example:**
```json
[
  {
    "id": "string",
    "name": "string",
    "content": "string",
    "user_id": "string",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```
- **Tags:** memories

### Create Memory
- **Endpoint Path:** `/api/v1/memories/create`
- **HTTP Method:** POST
- **Router/Module Name:** `memories`
- **Summary:** Creates a new memory
- **Request Body Example:**
```json
{
  "name": "string",
  "content": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** memories

### Get Memory by ID
- **Endpoint Path:** `/api/v1/memories/{id}`
- **HTTP Method:** GET
- **Router/Module Name:** `memories`
- **Summary:** Retrieves a specific memory by ID
- **Input Parameters:**
  - id (string): Memory ID
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** memories

### Update Memory by ID
- **Endpoint Path:** `/api/v1/memories/{id}`
- **HTTP Method:** POST
- **Router/Module Name:** `memories`
- **Summary:** Updates a specific memory by ID
- **Input Parameters:**
  - id (string): Memory ID
- **Request Body Example:**
```json
{
  "name": "string",
  "content": "string"
}
```
- **Response Example:**
```json
{
  "id": "string",
  "name": "string",
  "content": "string",
  "user_id": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```
- **Tags:** memories

## WebSocket State CRUD Operations

Real-time CRUD operations for Home Assistant states via WebSocket.

### Create State
- **Event Type:** `states:create`
- **Description:** Creates a new state in the database
- **Request Parameters:**
  - `entity_id` (string): Unique identifier for the entity
  - `state` (string): Current state value
  - `attributes` (object, optional): Additional state attributes
- **Success Response:**
```json
{
  "success": true,
  "data": {
    "state_id": 123,
    "entity_id": "light.test_light",
    "state": "on",
    "attributes": {},
    "last_changed": "2023-01-01T00:00:00Z",
    "last_updated": "2023-01-01T00:00:00Z"
  }
}
```
- **Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Get State
- **Event Type:** `states:get`
- **Description:** Retrieves the latest state for a specific entity
- **Request Parameters:**
  - `entity_id` (string): Unique identifier for the entity
- **Success Response:**
```json
{
  "success": true,
  "data": {
    "state_id": 123,
    "entity_id": "light.test_light",
    "state": "on",
    "attributes": {},
    "last_changed": "2023-01-01T00:00:00Z",
    "last_updated": "2023-01-01T00:00:00Z"
  }
}
```
- **Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Update State
- **Event Type:** `states:update`
- **Description:** Updates an existing state by ID
- **Request Parameters:**
  - `state_id` (integer): ID of the state to update
  - `state` (string, optional): New state value
  - `attributes` (object, optional): New state attributes
- **Success Response:**
```json
{
  "success": true,
  "data": {
    "state_id": 123,
    "entity_id": "light.test_light",
    "state": "off",
    "attributes": {},
    "last_changed": "2023-01-01T00:00:00Z",
    "last_updated": "2023-01-01T00:00:00Z"
  }
}
```
- **Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Delete State
- **Event Type:** `states:delete`
- **Description:** Deletes a state by ID
- **Request Parameters:**
  - `state_id` (integer): ID of the state to delete
- **Success Response:**
```json
{
  "success": true,
  "message": "State 123 deleted successfully"
}
```
- **Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### State Changed Event
- **Event Type:** `state_changed`
- **Description:** Broadcast to all clients when a state is created, updated, or deleted
- **Response:**
```json
{
  "type": "state_changed",
  "data": {
    "entity_id": "light.test_light",
    "new_state": {
      "state": "on",
      "attributes": {}
    }
  }
}
```

