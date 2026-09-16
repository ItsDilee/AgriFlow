/**
 * Lightweight API service — wraps native fetch with the Vite proxy (/api → :5000).
 * All functions return parsed JSON. On non-2xx responses, throws an Error
 * with the server's `message` field (or a generic fallback).
 *
 * Pass { auth: true } as the third argument to any function to automatically
 * attach the Bearer token from localStorage.
 */

const BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('agriflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
};

export const apiGet = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    headers: { ...(opts.auth ? getAuthHeader() : {}) },
  }).then(handleResponse);

export const apiPost = (path, body, opts = {}) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.auth ? getAuthHeader() : {}),
    },
    body: JSON.stringify(body),
  }).then(handleResponse);

export const apiPut = (path, body, opts = {}) =>
  fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.auth ? getAuthHeader() : {}),
    },
    body: JSON.stringify(body),
  }).then(handleResponse);

export const apiDelete = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { ...(opts.auth ? getAuthHeader() : {}) },
  }).then(handleResponse);

export const apiPatch = (path, body, opts = {}) =>
  fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.auth ? getAuthHeader() : {}),
    },
    body: JSON.stringify(body),
  }).then(handleResponse);
