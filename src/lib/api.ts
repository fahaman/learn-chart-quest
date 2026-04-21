const API_URL = "http://127.0.0.1:5000/api";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "An error occurred");
  }

  return data;
};
