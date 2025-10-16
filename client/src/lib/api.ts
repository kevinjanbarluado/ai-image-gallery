const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('supabase.auth.token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function uploadImages(files: File[], token: string) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload images');
  }

  return response.json();
}

export async function getImages(page = 1, limit = 20, token: string) {
  const response = await fetch(
    `${API_URL}/images?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }

  return response.json();
}

export async function getImageById(id: number, token: string) {
  const response = await fetch(`${API_URL}/images/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }

  return response.json();
}

export async function deleteImage(id: number, token: string) {
  const response = await fetch(`${API_URL}/images/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete image');
  }

  return response.json();
}

export async function searchImages(
  query?: string,
  color?: string,
  page = 1,
  limit = 20,
  token?: string
) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (color) params.append('color', color);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await fetch(`${API_URL}/search?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search images');
  }

  return response.json();
}

export async function findSimilarImages(imageId: number, token: string) {
  const response = await fetch(`${API_URL}/search/similar/${imageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to find similar images');
  }

  return response.json();
}

