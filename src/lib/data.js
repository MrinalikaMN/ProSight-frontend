import api from './api';

// Endpoints used by the app (they match the Spring Boot controllers).
export const endpoints = {
  projects: () => api.get('/api/projects').then((r) => r.data ?? []),
  createProject: (body) => api.post('/api/projects', body).then((r) => r.data),
  updateProject: (id, body) => api.put(`/api/projects/${id}`, body).then((r) => r.data),
  deleteProject: (id) => api.delete(`/api/projects/${id}`),

  tasks: (projectId) => api.get(`/api/projects/${projectId}/tasks`).then((r) => r.data ?? []),
  createTask: (projectId, body) => api.post(`/api/projects/${projectId}/tasks`, body).then((r) => r.data),
  // The backend only overwrites the fields you send, so { status } is enough to move a card.
  updateTask: (projectId, taskId, body) => api.put(`/api/projects/${projectId}/tasks/${taskId}`, body).then((r) => r.data),
  deleteTask: (projectId, taskId) => api.delete(`/api/projects/${projectId}/tasks/${taskId}`),

  warnings: (projectId) => api.get(`/api/projects/${projectId}/warnings`).then((r) => r.data ?? []),
  createWarning: (projectId, body) => api.post(`/api/projects/${projectId}/warnings`, body).then((r) => r.data),
  deleteWarning: (projectId, id) => api.delete(`/api/projects/${projectId}/warnings/${id}`),

  users: () => api.get('/api/auth/users').then((r) => r.data ?? []),

  // The signed-in person's notification settings
  me: () => api.get('/api/users/me').then((r) => r.data),
  updateMe: (body) => api.put('/api/users/me', body).then((r) => r.data),
  sendTestEmail: () => api.post('/api/users/me/test-email').then((r) => r.data),
  sendDigestNow: () => api.post('/api/users/me/digest-now').then((r) => r.data),

  // Risk register. Creating a risk with impact "High" makes the backend ask Gemini
  // for a mitigation step and save it as a recommendation.
  risks: (projectId) => api.get(`/api/risks/project/${projectId}`).then((r) => r.data ?? []),
  createRisk: (projectId, body) => api.post('/api/risks', { ...body, project: { id: projectId } }).then((r) => r.data),
  deleteRisk: (id) => api.delete(`/api/risks/${id}`),
  recommendations: (projectId) => api.get(`/api/recommendations/project/${projectId}`).then((r) => r.data ?? []),

  // Milestones. Completing and deleting need the updated MilestoneController.
  milestones: (projectId) => api.get(`/api/milestones/project/${projectId}`).then((r) => r.data ?? []),
  createMilestone: (projectId, body) => api.post('/api/milestones', { ...body, project: { id: projectId } }).then((r) => r.data),
  updateMilestone: (id, body) => api.put(`/api/milestones/${id}`, body).then((r) => r.data),
  deleteMilestone: (id) => api.delete(`/api/milestones/${id}`),

  alerts: (projectId) => api.get(`/api/alerts/project/${projectId}`).then((r) => r.data ?? []),
};

// Strip nested objects the backend sends back (project.tasks, task.project) so they are never re-posted.
export const cleanProject = (p) => { const copy = { ...p }; delete copy.tasks; return copy; };
export const cleanTask = (t) => { const copy = { ...t }; delete copy.project; return copy; };

// Loads every project with its tasks, warnings, risks and backend alerts, in parallel.
// One list failing (or an endpoint missing) does not break the whole page.
export async function loadPortfolio() {
  const projects = await endpoints.projects();
  const rows = await Promise.all(
    projects.map(async (p) => {
      const [tasks, warnings, risks, alerts] = await Promise.all([
        endpoints.tasks(p.id).catch(() => []),
        endpoints.warnings(p.id).catch(() => []),
        endpoints.risks(p.id).catch(() => []),
        endpoints.alerts(p.id).catch(() => []),
      ]);
      return { project: cleanProject(p), tasks: tasks.map(cleanTask), warnings, risks, alerts };
    })
  );
  return rows;
}
