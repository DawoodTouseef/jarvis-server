// API client for JARVIS backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface UserMetrics {
  active_users: number
  sessions: number
  new_users_today: number
}

interface ApiRequestMetrics {
  requests_per_second: number
  total_requests: number
  error_rate: number
  avg_response_time: number
}

interface CustomMetric {
  metric_name: string
  value: number
  unit: string
  timestamp: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface HasUsersResponse {
  has_users: boolean
}
interface Groups {
  model_config :any
    id: string
    user_id: string

    name: string
    description: string

    data: Object
    meta: Object

    permissions: Object
    user_ids: Array<string>

    created_at:number
    updated_at: number
}
interface LoginCredentials {
  email: string
  password: string
}
interface SignupCredentials {
  email: string
  password: string
  name: string;
}

// AddUserForm interface for admin user creation
interface AddUserForm extends SignupCredentials {
  profile_image_url?: string;
  role?: string;
}

// Extended signup credentials with additional user information
interface ExtendedSignupCredentials extends SignupCredentials {
  mobile?: string
  date_of_birth?: string
  location?: {
    latitude: number
    longitude: number
    address: string
  }
}

interface ContainerStats {
  id: string
  name: string
  image: string
  status: "running" | "stopped" | "paused" | "restarting"
  uptime: string
  cpu: number
  memory: number
  ports: string[]
  created: string
}

interface SystemMetrics {
  cpu: number
  memory: number
  network: number
  disk: number
  containers: number
  uptime: string
}

interface DeepsearchQuery {
  query: string
  filters?: Record<string, any>
  limit?: number
}

interface DeepsearchResult {
  id: string
  title: string
  content: string
  score: number
  metadata: Record<string, any>
}

export interface ConfigResponse {
  [key: string]: any
}

export interface DirectConnectionsConfig {
  ENABLE_DIRECT_CONNECTIONS: boolean
}

export interface ToolServerConnection {
  url: string
  path: string
  auth_type?: string
  key?: string
  config?: Record<string, any>
  enabled?: boolean
}
export interface OpenAIConnection {
  url: string

  key?: string
  config?: Record<string, any>
  api_key?: string
}
export interface ToolServersConfig {
  TOOL_SERVER_CONNECTIONS: ToolServerConnection[]
}

export interface CodeInterpreterConfig {
  ENABLE_CODE_EXECUTION: boolean
  CODE_EXECUTION_ENGINE: string
  CODE_EXECUTION_JUPYTER_URL?: string
  CODE_EXECUTION_JUPYTER_AUTH?: string
  CODE_EXECUTION_JUPYTER_AUTH_TOKEN?: string
  CODE_EXECUTION_JUPYTER_AUTH_PASSWORD?: string
  CODE_EXECUTION_JUPYTER_TIMEOUT?: number
  ENABLE_CODE_INTERPRETER: boolean
  CODE_INTERPRETER_ENGINE: string
  CODE_INTERPRETER_PROMPT_TEMPLATE?: string
  CODE_INTERPRETER_JUPYTER_URL?: string
  CODE_INTERPRETER_JUPYTER_AUTH?: string
  CODE_INTERPRETER_JUPYTER_AUTH_TOKEN?: string
  CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD?: string
  CODE_INTERPRETER_JUPYTER_TIMEOUT?: number
}

export interface ModelsConfig {
  DEFAULT_MODELS?: string
  MODEL_ORDER_LIST?: string[]
}

export interface PromptSuggestion {
  title: string[]
  content: string
}

export interface Banner {
  id: string
  title: string
  content: string
  priority: number
  active: boolean
}

export interface ApiUserSettings {
  profile: {
    name: string
    email: string
    avatar: string
    bio: string
  }
  system: {
    darkMode: boolean
    notifications: boolean
    autoRefresh: boolean
    refreshInterval: number
    language: string
    timezone: string
    theme: "light" | "dark" | "system"
    defaultModel: string
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    apiKeyRotation: boolean
  }
  integrations: {
    deepsearchApiKey: string
    webhookUrl: string
  }
  api: {
    keys: Array<{id: string, name: string, key: string, createdAt: string, lastUsed: string}>
    quota: {used: number, limit: number}
  }
  notifications: {
    email: boolean
    inApp: boolean
  }
  conversation: {
    exportEnabled: boolean
    clearHistoryEnabled: boolean
  }
}

export interface User {
  token: string,
  token_type: string,
  expires_at: string,
  id: string,
  email: string,
  name: string,
  role: string,
  profile_image_url: string,
  permissions: string[],
}

export interface ApiAdminConfig {
  SHOW_ADMIN_DETAILS: boolean
  WEBUI_URL: string
  ENABLE_SIGNUP: boolean
  ENABLE_API_KEY: boolean
  ENABLE_API_KEY_ENDPOINT_RESTRICTIONS: boolean
  API_KEY_ALLOWED_ENDPOINTS: string
  DEFAULT_USER_ROLE: string
  JWT_EXPIRES_IN: string
  ENABLE_COMMUNITY_SHARING: boolean
  ENABLE_MESSAGE_RATING: boolean
  ENABLE_CHANNELS: boolean
  ENABLE_NOTES: boolean
  ENABLE_USER_WEBHOOKS: boolean
  PENDING_USER_OVERLAY_TITLE: string | null
  PENDING_USER_OVERLAY_CONTENT: string | null
  RESPONSE_WATERMARK: string | null
}

// Perplexica Extension Interfaces
export interface ModelConnection {
  id: string
  name: string
  provider: string
  base_url: string
  api_key?: string
  model: string
  is_enabled: boolean
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ModelConnectionCreate {
  name: string
  provider: string
  base_url: string
  api_key?: string
  model: string
  is_enabled: boolean
  config?: Record<string, any>
}

export interface ModelConnectionUpdate {
  name?: string
  provider?: string
  base_url?: string
  api_key?: string
  model?: string
  is_enabled?: boolean
  config?: Record<string, any>
}

export interface EmbeddingRequest {
  model: string
  input: string | string[]
  user?: string
  encoding_format?: string
}

export interface EmbeddingData {
  object: string
  index: number
  embedding: number[]
}

export interface EmbeddingResponse {
  object: string
  data: EmbeddingData[]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export interface RetrieverRequest {
  query: string
  collection_name: string
  top_k: number
  filter?: Record<string, any>
}

export interface RetrieverDocument {
  content: string
  metadata: Record<string, any>
  score?: number
}

export interface RetrieverResponse {
  documents: RetrieverDocument[]
  query: string
  top_k: number
}

export interface Retriever {
  id: string
  name: string
  model_connection_id: string
  collection_name: string
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

// Dashboard schema types
export interface DashboardCard {
  type: string;
  title: string;
  subtitle?: string;
  entity?: string;
  data_source?: string;
  chart?: string;
  action?: string;
  properties?: Record<string, any>;
}

export interface DashboardView {
  title: string;
  subtitle?: string;
  cards: DashboardCard[];
  extension?: string;
}

export interface DashboardSchema {
  title: string;
  views: DashboardView[];
}

// Knowledge Base Interfaces
export interface KnowledgeBaseFile {
  id: string;
  meta: {
    name?: string;
    content_type?: string;
    size?: number;
  };
  created_at: number;
  updated_at: number;
}

export interface KnowledgeBase {
  id: string;
  user_id: string;
  name: string;
  description: string;
  data?: {
    file_ids?: string[];
  };
  meta?: Record<string, any>;
  access_control?: Record<string, any>;
  created_at: number;
  updated_at: number;
  files?: KnowledgeBaseFile[];
}

export interface KnowledgeBaseCreate {
  name: string;
  description: string;
  data?: Record<string, any>;
  access_control?: Record<string, any>;
}

export interface KnowledgeBaseUpdate {
  name?: string;
  description?: string;
  data?: Record<string, any>;
  access_control?: Record<string, any>;
}

// Home Assistant Interfaces
interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

interface Entity {
  entity_id: string;
  name: string;
  domain: string;
  state: string;
  icon?: string;
}

interface Area {
  id: number;
  name: string;
  icon?: string;
}

interface HomeAssistantLocationConfig {
  latitude: number;
  longitude: number;
  elevation?: number;
  unit_system?: string;
  time_zone?: string;
  location_name?: string;
}

interface HomeAssistantAutomation {
  automation_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: any[];
  condition?: any[];
  action: any[];
  mode?: string;
  max_exceeded?: string;
  variables?: Record<string, any>;
  last_triggered?: string;
  created: string;
  updated: string;
}

interface HomeAssistantConfig {
  // Configuration options for Home Assistant integration
  enabled: boolean;
  url?: string;
  api_key?: string;
  polling_interval?: number;
}

interface HomeAssistantAddon {
  id: number
  addon_id: string
  name: string
  description: string | null
  version: string
  enabled: boolean
  config: any | null
  manifest: any | null
  installed_at: string
  updated_at: string
  repository_url: string | null
  installed_from: string | null
}

// Define the signup response interface
export interface SignupResponse {
  token: string;
  token_type: string;
  expires_at: number | null;
  id: string;
  email: string;
  name: string;
  role: string;
  profile_image_url: string;
  permissions: string[];
}

// Pipeline Interfaces
export interface Pipeline {
  id: string;
  name: string;
  description: string;
  type: string;
  pipelines: string[];
  priority: number;
  valves: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // Method to set the authentication token
  setToken(token: string | null) {
    this.token = token
  }

  // Method to get the current token
  getToken(): string | null {
    return this.token
  }

  // Method to get the base URL (needed for file uploads)
  getBaseUrl(): string {
    return this.baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) { 
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.detail || data.error || `HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<{ token: string; user: any }>("/api/v1/auths/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      this.token = response.data.token
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", response.data.token)
      }
    }

    return response
  }


  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>("/api/v1/auths/signout", {
      method: "GET",
    })

    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken")
    }

    return response
  }

  async signup(credentials: SignupCredentials): Promise<ApiResponse<SignupResponse>> {
    const response = await this.request<SignupResponse>("/api/v1/auths/signup", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
      }),
    })

    if (response.success && response.data) {
      this.token = response.data.token
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", response.data.token)
      }
    }

    return response
  }

  // Extended signup method to handle additional user information
  async extendedSignup(credentials: ExtendedSignupCredentials): Promise<ApiResponse<SignupResponse>> {
    const response = await this.request<SignupResponse>("/api/v1/auths/extended-signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      this.token = response.data.token
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", response.data.token)
      }
    }

    return response
  }

  // Check if there are existing users
  async hasUsers(): Promise<ApiResponse<HasUsersResponse>> {
    return this.request<HasUsersResponse>("/api/v1/auths/has-users", {
      method: "GET",
    })
  }

  // Analytics Methods with rate limiting
  private async _rateLimitedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Simple rate limiting: delay if requests are too frequent
    const now = Date.now();
    const timeSinceLastRequest = now - (this as any)._lastRequestTime || 0;
    
    if (timeSinceLastRequest < 100) { // Minimum 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
    }
    
    (this as any)._lastRequestTime = Date.now();
    return this.request<T>(endpoint, options);
  }

  async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    return this._rateLimitedRequest<SystemMetrics>("/api/v1/analytics/system");
  }

  async getUserMetrics(): Promise<ApiResponse<UserMetrics>> {
    return this._rateLimitedRequest<UserMetrics>("/api/v1/analytics/users");
  }

  async getApiRequestMetrics(): Promise<ApiResponse<ApiRequestMetrics>> {
    return this._rateLimitedRequest<ApiRequestMetrics>("/api/v1/analytics/api-requests");
  }

  async getCustomMetrics(): Promise<ApiResponse<CustomMetric[]>> {
    return this._rateLimitedRequest<CustomMetric[]>("/api/v1/analytics/custom");
  }

  // Container Management
  async getContainers(): Promise<ApiResponse<ContainerStats[]>> {
    return this.request<ContainerStats[]>("/api/v1/containers/")
  }

  async startContainer(containerId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/containers/${containerId}/action`, {
      method: "POST",
      body: JSON.stringify({ action: "start" }),
    })
  }

  async stopContainer(containerId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/containers/${containerId}/action`, {
      method: "POST",
      body: JSON.stringify({ action: "stop" }),
    })
  }

  async pauseContainer(containerId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/containers/${containerId}/action`, {
      method: "POST",
      body: JSON.stringify({ action: "pause" }),
    })
  }

  async restartContainer(containerId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/containers/${containerId}/action`, {
      method: "POST",
      body: JSON.stringify({ action: "restart" }),
    })
  }

  async removeContainer(containerId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/containers/${containerId}`, {
      method: "DELETE",
    })
  }

  // Deepsearch
  async deepsearchQuery(query: DeepsearchQuery): Promise<ApiResponse<DeepsearchResult[]>> {
    // Use the existing retrieval endpoint for deepsearch
    return this.request<DeepsearchResult[]>("/api/v1/retrieval/query", {
      method: "POST",
      body: JSON.stringify(query),
    })
  }

  
  async getModelsConfig(): Promise<ApiResponse<ModelsConfig>> {
    return this.request<ModelsConfig>("/api/v1/configs/models")
  }

  async setModelsConfig(config: ModelsConfig): Promise<ApiResponse<ModelsConfig>> {
    return this.request<ModelsConfig>("/api/v1/configs/models", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  async setDefaultSuggestions(suggestions: PromptSuggestion[]): Promise<ApiResponse<PromptSuggestion[]>> {
    return this.request<PromptSuggestion[]>("/api/v1/configs/suggestions", {
      method: "POST",
      body: JSON.stringify({ suggestions }),
    })
  }

  async getBanners(): Promise<ApiResponse<Banner[]>> {
    return this.request<Banner[]>("/api/v1/configs/banners")
  }

  async setBanners(banners: Banner[]): Promise<ApiResponse<Banner[]>> {
    return this.request<Banner[]>("/api/v1/configs/banners", {
      method: "POST",
      body: JSON.stringify({ banners }),
    })
  }
  async getSessionUser(): Promise<ApiResponse<User>> {
    return this.request<User>("/api/v1/auths/", {
      method: "GET",
    })
  }

  // Update user profile
  async updateProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/auths/update/profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    })
  }

  // User Settings
  async getUserSettings(): Promise<ApiResponse<ApiUserSettings>> {
    return this.request<ApiUserSettings>("/api/v1/users/user/settings", {
      method: "GET",
    })
  }

  async updateUserSettings(settings: ApiUserSettings): Promise<ApiResponse<ApiUserSettings>> {
    return this.request<ApiUserSettings>("/api/v1/users/user/settings/update", {
      method: "POST",
      body: JSON.stringify(settings),
    })
  }

  // Admin User Management
  async getUsers(page: number = 1): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/users/?page=${page}`, {
      method: "GET",
    })
  }
  
  async addUser(userData: AddUserForm): Promise<ApiResponse<SignupResponse>> {
    return this.request<SignupResponse>("/api/v1/auths/add", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }
  
  async getAllUsers(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/users/all", {
      method: "GET",
    })
  }
  async get_openai_config(): Promise<ApiResponse<any>> {
    return this.request<any>("/openai/config", {
      method: "GET",
    })
  }
  async set_openai_config(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/openai/config/update", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }
  async updateUser(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/users/${userId}/update`, {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }
  
  async deleteUser(userId: string): Promise<ApiResponse<boolean>> {
    return this.request<boolean>(`/api/v1/users/${userId}`, {
      method: "DELETE",
    })
  }
  async getUser(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/users`, {
      method: "GET",
    })
  }
  // Admin Configuration
  async getAdminConfig(): Promise<ApiResponse<ApiAdminConfig>> {
    return this.request<ApiAdminConfig>("/api/v1/auths/admin/config", {
      method: "GET",
    })
  }

  async updateAdminConfig(config: ApiAdminConfig): Promise<ApiResponse<ApiAdminConfig>> {
    return this.request<ApiAdminConfig>("/api/v1/auths/admin/config", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  // Web Search Configuration
  async getWebSearchConfig(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/retrieval/config", {
      method: "GET",
    })
  }

  async updateWebSearchConfig(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/retrieval/config/update", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  // Ollama Configuration
  async getOllamaConfig(): Promise<ApiResponse<any>> {
    return this.request<any>("/ollama/config", {
      method: "GET",
    })
  }

  async updateOllamaConfig(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/ollama/config/update", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  async verifyOllamaConnection(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/ollama/verify", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  // Ollama Models
  async getOllamaModels(urlIdx?: number): Promise<ApiResponse<any>> {
    const endpoint = urlIdx !== undefined 
      ? `/ollama/api/tags/${urlIdx}` 
      : "/ollama/api/tags";
    return this.request<any>(endpoint, {
      method: "GET",
    })
  }

  // OpenAI Configuration
  async getOpenAIConfig(): Promise<ApiResponse<any>> {
    return this.request<any>("/openai/config", {
      method: "GET",
    })
  }

  async updateOpenAIConfig(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/openai/config/update", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  async verifyOpenAIConnection(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/openai/verify", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  // OpenAI Models
  async getOpenAIModels(urlIdx?: number): Promise<ApiResponse<any>> {
    const endpoint = urlIdx !== undefined 
      ? `/openai/models/${urlIdx}` 
      : "/openai/models";
    return this.request<any>(endpoint, {
      method: "GET",
    })
  }

  // Configurations
  async getConfig(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/configs/connections", {
      method: "GET",
    })
  }

  async updateConfig(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/configs/connections", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }

  // Models
  async getModels(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/models", {
      method: "GET",
    })
  }

  async getBaseModels(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/models/base", {
      method: "GET",
    })
  }

  async createNewModel(modelData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/models/create", {
      method: "POST",
      body: JSON.stringify(modelData),
    })
  }

  async exportModels(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/models/export", {
      method: "GET",
    })
  }

  async importModels(modelsData: any): Promise<ApiResponse<boolean>> {
    return this.request<boolean>("/api/v1/models/import", {
      method: "POST",
      body: JSON.stringify(modelsData),
    })
  }

  async syncModels(modelsData: any): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/models/sync", {
      method: "POST",
      body: JSON.stringify(modelsData),
    })
  }

  async getModelById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/models/model?id=${id}`, {
      method: "GET",
    })
  }

  async getModelProfileImage(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/models/model/profile/image?id=${id}`, {
      method: "GET",
    })
  }

  async toggleModelStatus(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/models/model/toggle?id=${id}`, {
      method: "POST",
    })
  }

  async updateModel(id: string, modelData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/models/model/update?id=${id}`, {
      method: "POST",
      body: JSON.stringify(modelData),
    })
  }

  async deleteModel(id: string): Promise<ApiResponse<boolean>> {
    return this.request<boolean>(`/api/v1/models/model/delete?id=${id}`, {
      method: "DELETE",
    })
  }

  // Ollama Model Pulling
  async pullOllamaModel(modelName: string, urlIdx: number = 0): Promise<ApiResponse<any>> {
    return this.request<any>(`/ollama/api/pull/${urlIdx}`, {
      method: "POST",
      body: JSON.stringify({ model: modelName }),
    })
  }

  async deleteAllModels(): Promise<ApiResponse<boolean>> {
    return this.request<boolean>("/api/v1/models/delete/all", {
      method: "DELETE",
    })
  }

  // File Upload Method
  async uploadFile(file: File): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = `${this.baseUrl}/api/v1/files/`
      
      const headers: HeadersInit = {}
      if (this.token) { 
        headers.Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: headers
      })

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = { message: text };
      }

      // Log the full response for debugging
      console.log("File upload response:", response.status, data);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.detail || data.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error"
      }
    }
  }

  // Knowledge Base Methods
  async getKnowledgeBases(): Promise<ApiResponse<KnowledgeBase[]>> {
    return this.request<KnowledgeBase[]>("/api/v1/knowledge/", {
      method: "GET",
    })
  }

  // Chat Methods
  async getChats(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/chats/", {
      method: "GET",
    })
  }

  async getKnowledgeBaseById(id: string): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>(`/api/v1/knowledge/${id}`, {
      method: "GET",
    })
  }

  async createKnowledgeBase(data: KnowledgeBaseCreate): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>("/api/v1/knowledge/create", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateKnowledgeBase(id: string, data: KnowledgeBaseUpdate): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>(`/api/v1/knowledge/${id}/update`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async deleteKnowledgeBase(id: string): Promise<ApiResponse<boolean>> {
    return this.request<boolean>(`/api/v1/knowledge/${id}/delete`, {
      method: "DELETE",
    })
  }

  async addFileToKnowledgeBase(id: string, fileId: string): Promise<ApiResponse<KnowledgeBase>> {
    try {
      const response = await this.request<KnowledgeBase>(`/api/v1/knowledge/${id}/file/add`, {
        method: "POST",
        body: JSON.stringify({ file_id: fileId }),
      });
      
      // Log the full response for debugging
      console.log("Add file to knowledge base response:", response);
      
      return response;
    } catch (error) {
      console.error("Error adding file to knowledge base:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add file to knowledge base"
      };
    }
  }

  async removeFileFromKnowledgeBase(id: string, fileId: string): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>(`/api/v1/knowledge/${id}/file/remove`, {
      method: "POST",
      body: JSON.stringify({ file_id: fileId }),
    })
  }

  async updateFileInKnowledgeBase(id: string, fileId: string): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>(`/api/v1/knowledge/${id}/file/update`, {
      method: "POST",
      body: JSON.stringify({ file_id: fileId }),
    })
  }

  async resetKnowledgeBase(id: string): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>(`/api/v1/knowledge/${id}/reset`, {
      method: "POST",
    })
  }

  async reindexKnowledgeFiles(): Promise<ApiResponse<boolean>> {
    return this.request<boolean>("/api/v1/knowledge/reindex", {
      method: "POST",
    })
  }

  async addFilesToKnowledgeBatch(id: string, fileIds: string[]): Promise<ApiResponse<KnowledgeBase>> {
    const requestData = fileIds.map(fileId => ({ file_id: fileId }));
    return this.request<KnowledgeBase>(`/api/v1/knowledge/${id}/files/batch/add`, {
      method: "POST",
      body: JSON.stringify(requestData),
    })
  }

  // Home Assistant Methods
  async getHomeAssistantEntities(): Promise<ApiResponse<Entity[]>> {
    return this.request<Entity[]>("/api/v1/homeassistant/states", {
      method: "GET",
    })
  }

  async getHomeAssistantEntity(entityId: string): Promise<ApiResponse<EntityState>> {
    return this.request<EntityState>(`/api/v1/homeassistant/states/${entityId}`, {
      method: "GET",
    })
  }

  async setHomeAssistantEntityState(entityId: string, state: string, attributes: Record<string, any> = {}): Promise<ApiResponse<EntityState>> {
    return this.request<EntityState>(`/api/v1/homeassistant/states/${entityId}`, {
      method: "POST",
      body: JSON.stringify({ state, attributes }),
    })
  }

  async getHomeAssistantEntityHistory(entityId: string, startTime: string, endTime?: string): Promise<ApiResponse<EntityState[]>> {
    const params = new URLSearchParams({ start_time: startTime });
    if (endTime) params.append("end_time", endTime);
    
    return this.request<EntityState[]>(`/api/v1/homeassistant/states/${entityId}/history?${params.toString()}`, {
      method: "GET",
    })
  }

  async getHomeAssistantEvents(eventType?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (eventType) params.append("event_type", eventType);
    
    return this.request<any[]>(`/api/v1/homeassistant/events?${params.toString()}`, {
      method: "GET",
    })
  }

  async fireHomeAssistantEvent(eventType: string, eventData: Record<string, any> = {}): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/events/${eventType}`, {
      method: "POST",
      body: JSON.stringify({ event_data: eventData }),
    })
  }

  async callHomeAssistantService(domain: string, service: string, serviceData: Record<string, any> = {}): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/services/${domain}/${service}`, {
      method: "POST",
      body: JSON.stringify(serviceData),
    })
  }

  async getHomeAssistantEntitiesRegistry(domain?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (domain) params.append("domain", domain);
    
    return this.request<any[]>(`/api/v1/homeassistant/registry/entities?${params.toString()}`, {
      method: "GET",
    })
  }

  async registerHomeAssistantEntity(entityData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/registry/entities", {
      method: "POST",
      body: JSON.stringify(entityData),
    })
  }

  async getHomeAssistantDevices(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/homeassistant/registry/devices", {
      method: "GET",
    })
  }

  async registerHomeAssistantDevice(deviceData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/registry/devices", {
      method: "POST",
      body: JSON.stringify(deviceData),
    })
  }

  async getHomeAssistantAreas(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/homeassistant/registry/areas", {
      method: "GET",
    })
  }

  async createHomeAssistantArea(areaData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/registry/areas", {
      method: "POST",
      body: JSON.stringify(areaData),
    })
  }

  // New methods for floors, areas, and sub-areas
  async getHomeAssistantFloors(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/homeassistant/floors", {
      method: "GET",
    })
  }

  async createHomeAssistantFloor(floorData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/floors", {
      method: "POST",
      body: JSON.stringify(floorData),
    })
  }

  async updateHomeAssistantFloor(floorId: number, floorData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/floors/${floorId}`, {
      method: "PUT",
      body: JSON.stringify(floorData),
    })
  }

  async deleteHomeAssistantFloor(floorId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/floors/${floorId}`, {
      method: "DELETE",
    })
  }

  async getHomeAssistantAreasNew(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/homeassistant/areas", {
      method: "GET",
    })
  }

  async createHomeAssistantAreaNew(areaData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/areas", {
      method: "POST",
      body: JSON.stringify(areaData),
    })
  }

  async updateHomeAssistantArea(areaId: number, areaData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/areas/${areaId}`, {
      method: "PUT",
      body: JSON.stringify(areaData),
    })
  }

  async deleteHomeAssistantArea(areaId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/areas/${areaId}`, {
      method: "DELETE",
    })
  }

  async getHomeAssistantSubAreas(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/homeassistant/sub_areas", {
      method: "GET",
    })
  }

  async createHomeAssistantSubArea(subAreaData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/sub_areas", {
      method: "POST",
      body: JSON.stringify(subAreaData),
    })
  }

  async updateHomeAssistantSubArea(subAreaId: number, subAreaData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/sub_areas/${subAreaId}`, {
      method: "PUT",
      body: JSON.stringify(subAreaData),
    })
  }

  async deleteHomeAssistantSubArea(subAreaId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/sub_areas/${subAreaId}`, {
      method: "DELETE",
    })
  }

  async getHomeAssistantStatistics(statisticId: string, startTime: string, endTime?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ start_time: startTime });
    if (endTime) params.append("end_time", endTime);
    
    return this.request<any[]>(`/api/v1/homeassistant/statistics/${statisticId}?${params.toString()}`, {
      method: "GET",
    })
  }

  async recordHomeAssistantStatistics(statisticId: string, statisticsData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/statistics/${statisticId}`, {
      method: "POST",
      body: JSON.stringify(statisticsData),
    })
  }

  async getHomeAssistantRecorderInfo(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/recorder/info", {
      method: "GET",
    })
  }

  async purgeHomeAssistantRecorderData(beforeDate: string): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/recorder/purge", {
      method: "POST",
      body: JSON.stringify({ before_date: beforeDate }),
    })
  }

  // Home Assistant Location Methods
  async getHomeAssistantLocation(): Promise<ApiResponse<HomeAssistantLocationConfig>> {
    return this.request<HomeAssistantLocationConfig>("/api/v1/homeassistant/location", {
      method: "GET",
    })
  }

  async updateHomeAssistantLocation(locationData: HomeAssistantLocationConfig): Promise<ApiResponse<HomeAssistantLocationConfig>> {
    return this.request<HomeAssistantLocationConfig>("/api/v1/homeassistant/location", {
      method: "POST",
      body: JSON.stringify(locationData),
    })
  }

  async getHomeAssistantConfig(): Promise<ApiResponse<Record<string, any>>> {
    return this.request<Record<string, any>>("/api/v1/homeassistant/config", {
      method: "GET",
    })
  }

  // Home Assistant Automation Methods
  async getHomeAssistantAutomations(): Promise<ApiResponse<HomeAssistantAutomation[]>> {
    return this.request<HomeAssistantAutomation[]>("/api/v1/homeassistant/automations", {
      method: "GET",
    })
  }

  async getHomeAssistantAutomation(automationId: string): Promise<ApiResponse<HomeAssistantAutomation>> {
    return this.request<HomeAssistantAutomation>(`/api/v1/homeassistant/automations/${automationId}`, {
      method: "GET",
    })
  }

  async createHomeAssistantAutomation(automationData: any): Promise<ApiResponse<HomeAssistantAutomation>> {
    return this.request<HomeAssistantAutomation>("/api/v1/homeassistant/automations", {
      method: "POST",
      body: JSON.stringify(automationData),
    })
  }

  async updateHomeAssistantAutomation(automationId: string, automationData: any): Promise<ApiResponse<HomeAssistantAutomation>> {
    return this.request<HomeAssistantAutomation>(`/api/v1/homeassistant/automations/${automationId}`, {
      method: "PUT",
      body: JSON.stringify(automationData),
    })
  }

  async deleteHomeAssistantAutomation(automationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/automations/${automationId}`, {
      method: "DELETE",
    })
  }

  async triggerHomeAssistantAutomation(automationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/automations/${automationId}/trigger`, {
      method: "POST",
    })
  }

  async enableHomeAssistantAutomation(automationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/automations/${automationId}/enable`, {
      method: "POST",
    })
  }

  async disableHomeAssistantAutomation(automationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/automations/${automationId}/disable`, {
      method: "POST",
    })
  }

  // Home Assistant Integration Methods
  async getHomeAssistantIntegrations(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/homeassistant/integrations", {
      method: "GET",
    })
  }

  async getHomeAssistantIntegration(integrationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/integrations/${integrationId}`, {
      method: "GET",
    })
  }

  async createHomeAssistantIntegration(integrationData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/homeassistant/integrations", {
      method: "POST",
      body: JSON.stringify(integrationData),
    })
  }

  async updateHomeAssistantIntegration(integrationId: string, integrationData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/integrations/${integrationId}`, {
      method: "PUT",
      body: JSON.stringify(integrationData),
    })
  }

  async deleteHomeAssistantIntegration(integrationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/integrations/${integrationId}`, {
      method: "DELETE",
    })
  }

  async enableHomeAssistantIntegration(integrationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/integrations/${integrationId}/enable`, {
      method: "POST",
    })
  }

  async disableHomeAssistantIntegration(integrationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/integrations/${integrationId}/disable`, {
      method: "POST",
    })
  }

  async getAvailableIntegrations(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/homeassistant/integrations/registry/available", {
      method: "GET",
    })
  }

  async startIntegrationFlow(integrationId: string, configData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/integrations/${integrationId}/start_flow`, {
      method: "POST",
      body: JSON.stringify(configData),
    })
  }

  // Home Assistant Addon Methods
  async getHomeAssistantAddons(): Promise<ApiResponse<HomeAssistantAddon[]>> {
    return this.request<HomeAssistantAddon[]>("/api/v1/homeassistant/addons", {
      method: "GET",
    })
  }

  async getHomeAssistantAddon(addonId: string): Promise<ApiResponse<HomeAssistantAddon>> {
    return this.request<HomeAssistantAddon>(`/api/v1/homeassistant/addons/${addonId}`, {
      method: "GET",
    })
  }

  async createHomeAssistantAddon(addonData: any): Promise<ApiResponse<HomeAssistantAddon>> {
    return this.request<HomeAssistantAddon>("/api/v1/homeassistant/addons", {
      method: "POST",
      body: JSON.stringify(addonData),
    })
  }

  async updateHomeAssistantAddon(addonId: string, addonData: any): Promise<ApiResponse<HomeAssistantAddon>> {
    return this.request<HomeAssistantAddon>(`/api/v1/homeassistant/addons/${addonId}`, {
      method: "PUT",
      body: JSON.stringify(addonData),
    })
  }

  async deleteHomeAssistantAddon(addonId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/addons/${addonId}`, {
      method: "DELETE",
    })
  }

  async enableHomeAssistantAddon(addonId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/addons/${addonId}/enable`, {
      method: "POST",
    })
  }

  async disableHomeAssistantAddon(addonId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/addons/${addonId}/disable`, {
      method: "POST",
    })
  }

  async installHomeAssistantAddon(addonId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/addons/${addonId}/install`, {
      method: "POST",
    })
  }

  async uninstallHomeAssistantAddon(addonId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/homeassistant/addons/${addonId}/uninstall`, {
      method: "POST",
    })
  }

  // Deprecated method - replaced with getKnowledgeBases
  async get_knowledge(): Promise<ApiResponse<any>> {
    return this.getKnowledgeBases()
  }
  
  // Deprecated method - replaced with getKnowledgeBases
  async get_knowledge_by_id(): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/knowledge/list`, {
      method: "GET",
    })
  }
  
  // Deprecated method - replaced with createKnowledgeBase
  async create_knowledge(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/knowledge/create", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Audio Configuration Methods
  async getAudioConfig(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/audio/config", {
      method: "GET",
    })
  }

  async updateAudioConfig(config: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/audio/config/update", {
      method: "POST",
      body: JSON.stringify(config),
    })
  }
  
  // Audio Transcription Method
  async transcribeAudio(file: File): Promise<ApiResponse<any>> {
    // Check if file is empty
    if (file.size === 0) {
      return {
        success: false,
        error: "Selected file is empty. Please choose a valid audio file."
      }
    }
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = `${this.baseUrl}/api/v1/audio/transcriptions`
      
      const headers: HeadersInit = {}
      if (this.token) { 
        headers.Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: headers
      })

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.detail || data.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error"
      }
    }
  }
  
  // Text to Speech Method
  async textToSpeech(text: string): Promise<ApiResponse<Blob>> {
    try {
      const url = `${this.baseUrl}/api/v1/audio/speech`
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (this.token) { 
        (headers as Record<string, string>).Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ input: text }),
        headers: headers
      })

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { message: text };
        }
        
        return {
          success: false,
          error: errorData.message || errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      // Return the audio as a Blob
      const blob = await response.blob();
      return {
        success: true,
        data: blob
      }
    } catch (error) {
      console.error("Error in text-to-speech:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error"
      }
    }
  }
  
  async getgroups():Promise<ApiResponse<any>>{
    return this.request<any>("/api/v1/groups/")
  }
  async addGroup(groupData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/groups/create", {
      method: "POST",
      body: JSON.stringify(groupData),
    })
  }
  async updateGroup(groupData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/groups/id/${groupData.id}/update`, {
      method: "POST",
      body: JSON.stringify(groupData),
    })
  }
  
  async deleteGroup(groupId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/groups/id/${groupId}/delete`, {
      method: "DELETE",
    })
  }

  async getPipelinesList(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/pipelines/list");
  }
  async getPipelineById(id: string, urlIdx?: number): Promise<ApiResponse<Pipeline>> {
    const url = urlIdx !== undefined 
      ? `/api/v1/pipelines/?urlIdx=${urlIdx}` 
      : `/api/v1/pipelines/${id}`;
    return this.request<any>(url, {
      method: "GET",
    });
  }

  async createPipelineByFile(formData: FormData, urlIdx: number): Promise<ApiResponse<Pipeline>> {
    try {
      const url = `${this.baseUrl}/api/v1/pipelines/upload`;
      
      const headers: HeadersInit = {};
      if (this.token) { 
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: headers
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.detail || data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error("Error creating pipeline by file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create pipeline from file"
      };
    }
  }

  async createPipelineByUrl(url: string, urlIdx: number): Promise<ApiResponse<Pipeline>> {
    try {
      // Validate URL format
      if (!url || !url.startsWith('http')) {
        return {
          success: false,
          error: "Invalid URL provided"
        };
      }
      
      return this.request<Pipeline>("/api/v1/pipelines/add", {
        method: "POST",
        body: JSON.stringify({
          url: url,
          urlIdx: urlIdx
        }),
      });
    } catch (error) {
      console.error("Error creating pipeline from URL:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create pipeline from URL"
      };
    }
  }

  async updatePipeline(id: string, pipelineData: Partial<Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>>, urlIdx?: number): Promise<ApiResponse<Pipeline>> {
    // If urlIdx is not provided, try to get it from the pipeline list
    let actualUrlIdx = urlIdx;
    if (actualUrlIdx === undefined) {
      const listResponse = await this.getPipelinesList();
      if (listResponse.success && listResponse.data && listResponse.data.data) {
        const pipelineList = listResponse.data.data;
        const pipelineInfo = pipelineList.find((p: any) => p.id === id);
        actualUrlIdx = pipelineInfo ? pipelineInfo.idx : 0;
      }
    }
    
    // Use the backend update endpoint
    const url = actualUrlIdx !== undefined 
      ? `/api/v1/pipelines/${id}?urlIdx=${actualUrlIdx}` 
      : `/api/v1/pipelines/${id}`;
    return this.request<Pipeline>(url, {
      method: "POST",
      body: JSON.stringify(pipelineData),
    });
  }

  async deletePipeline(id: string, urlIdx?: number): Promise<ApiResponse<boolean>> {
    // If urlIdx is not provided, try to get it from the pipeline list
    let actualUrlIdx = urlIdx;
    if (actualUrlIdx === undefined) {
      const listResponse = await this.getPipelinesList();
      if (listResponse.success && listResponse.data && listResponse.data.data) {
        const pipelineList = listResponse.data.data;
        const pipelineInfo = pipelineList.find((p: any) => p.id === id);
        actualUrlIdx = pipelineInfo ? pipelineInfo.idx : 0;
      }
    }
    
    // Use the delete endpoint with proper form data
    return this.request<boolean>("/api/v1/pipelines/delete", {
      method: "DELETE",
      body: JSON.stringify({
        id: id,
        urlIdx: actualUrlIdx
      }),
    });
  }

  async getPipelineValves(id: string): Promise<ApiResponse<Record<string, any>>> {
    return this.request<Record<string, any>>(`/api/v1/pipelines/${id}/valves`, {
      method: "GET",
    });
  }

  async updatePipelineValves(id: string, valvesData: Record<string, any>): Promise<ApiResponse<Record<string, any>>> {
    return this.request<Record<string, any>>(`/api/v1/pipelines/${id}/valves`, {
      method: "POST",
      body: JSON.stringify(valvesData),
    });
  }
  
}

export const apiClient = new ApiClient()
export type { 
  ApiResponse, 
  SystemMetrics, 
  ContainerStats, 
  DeepsearchQuery, 
  DeepsearchResult,
  LoginCredentials,
  ApiUserSettings as UserSettings,
  ApiAdminConfig as AdminConfig,
  EntityState,
  Entity,
  Area,
  HomeAssistantConfig,
  HomeAssistantLocationConfig,
  HomeAssistantAutomation,
  HomeAssistantAddon
}
