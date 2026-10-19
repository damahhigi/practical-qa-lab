'use strict';

// Stage 3: entirely browser-local REST API simulator. No fetch(), accounts, or real HTTP calls.
// Data changes made with POST, PUT, PATCH, or DELETE are reset when the page reloads.
const initialUsers = {
  '101': { id: 101, name: 'Jane Wanjiku', email: 'jane@example.com', role: 'customer', active: true },
  '102': { id: 102, name: 'Alex Kimani', email: 'alex@example.com', role: 'customer', active: false }
};
const demoUsers = new Map(Object.entries(initialUsers).map(([id, user]) => [id, { ...user }]));
let nextId = 103;

const requestForm = document.querySelector('#requestForm');
const requestMethod = document.querySelector('#requestMethod');
const endpointInput = document.querySelector('#endpointPath');
const requestBodyGroup = document.querySelector('#requestBodyGroup');
const requestBody = document.querySelector('#requestBody');
const requestBodyHelp = document.querySelector('#requestBodyHelp');
const methodDescription = document.querySelector('#methodDescription');
const responseEmpty = document.querySelector('#responseEmpty');
const responseContent = document.querySelector('#responseContent');
const responseStatus = document.querySelector('#responseStatus');
const requestAnnouncement = document.querySelector('#requestAnnouncement');
const lastRequest = document.querySelector('#lastRequest');
const responseBody = document.querySelector('#responseBody');
const responseHeaders = document.querySelector('#responseHeaders');
const responseTip = document.querySelector('#responseTip');
const bodyHeading = document.querySelector('#bodyHeading');
const bodyMediaType = document.querySelector('#bodyMediaType');

const exampleBodies = {
  valid: JSON.stringify({ name: 'Amina Otieno', email: 'amina@example.com', role: 'customer', active: true }, null, 2),
  missing: JSON.stringify({ name: 'Amina Otieno', role: 'customer' }, null, 2),
  malformed: '{ "name": "Amina Otieno", "email": "amina@example.com", ',
  putValid: JSON.stringify({ name: 'Jane Wanjiku Updated', email: 'jane.updated@example.com', role: 'admin', active: true }, null, 2),
  putMissing: JSON.stringify({ name: 'Jane Wanjiku Updated', email: 'jane.updated@example.com' }, null, 2),
  patchRole: JSON.stringify({ role: 'admin' }, null, 2),
  patchInvalid: JSON.stringify({ active: 'yes' }, null, 2)
};

function errorResponse(status, statusText, message, details, allow) {
  const body = { error: statusText, message };
  if (details?.length) body.details = details;
  return { status, statusText, body, allow };
}

function parseObject(rawBody) {
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (_) {
    return { error: errorResponse(400, 'Bad Request', 'Request body must be valid JSON.') };
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: errorResponse(422, 'Unprocessable Content', 'Request body must be a JSON object.', ['Expected an object, not an array or primitive.']) };
  }
  return { payload };
}

const editableFields = ['name', 'email', 'role', 'active'];
function validateUserFields(payload, partial = false) {
  const errors = [];
  const unknown = Object.keys(payload).filter(key => !editableFields.includes(key));
  if (unknown.length) errors.push(`Unknown or read-only field(s): ${unknown.join(', ')}.`);
  if (partial && Object.keys(payload).length === 0) errors.push('PATCH requires at least one field to update.');
  for (const field of editableFields) {
    if (!Object.hasOwn(payload, field)) {
      if (!partial) errors.push(`${field} is required.`);
      continue;
    }
    const value = payload[field];
    switch (field) {
      case 'name':
        if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 60) {
          errors.push('name must be a string containing 2–60 characters.');
        }
        break;
      case 'email':
        if (typeof value !== 'string' || value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.push('email must be a valid email address.');
        }
        break;
      case 'role':
        if (!['customer', 'admin'].includes(value)) errors.push('role must be customer or admin.');
        break;
      case 'active':
        if (typeof value !== 'boolean') errors.push('active must be true or false (a JSON boolean).');
        break;
    }
  }
  return errors;
}

function sanitizedFields(payload) {
  const fields = {};
  if (Object.hasOwn(payload, 'name')) fields.name = payload.name.trim();
  if (Object.hasOwn(payload, 'email')) fields.email = payload.email.trim().toLowerCase();
  if (Object.hasOwn(payload, 'role')) fields.role = payload.role;
  if (Object.hasOwn(payload, 'active')) fields.active = payload.active;
  return fields;
}

function emailInUse(email, excludedId = null) {
  return Array.from(demoUsers.values()).some(user =>
    String(user.id) !== String(excludedId) && user.email.toLowerCase() === email.toLowerCase()
  );
}

function simulateGet(path) {
  const match = /^\/api\/users\/(\d+)$/.exec(path);
  if (!match) return errorResponse(400, 'Bad Request', 'Use /api/users/{id} with a numeric user ID.');
  const user = demoUsers.get(match[1]);
  if (!user) return errorResponse(404, 'Not Found', `No user found with ID ${match[1]}.`);
  return { status: 200, statusText: 'OK', body: { data: user } };
}

function simulatePost(path, rawBody) {
  if (path !== '/api/users') {
    if (/^\/api\/users\/\d+$/.test(path)) {
      return errorResponse(405, 'Method Not Allowed', 'POST is allowed on /api/users, not an individual user resource.', null, 'GET, PUT, PATCH, DELETE');
    }
    return errorResponse(404, 'Not Found', 'POST endpoint not found. Use /api/users.');
  }

  const parsed = parseObject(rawBody);
  if (parsed.error) return parsed.error;
  // POST retains Stage 2's optional role and active defaults.
  const payload = { role: 'customer', active: true, ...parsed.payload };
  const errors = validateUserFields(payload);
  if (errors.length) return errorResponse(422, 'Unprocessable Content', 'The request body contains validation errors.', errors);
  const fields = sanitizedFields(payload);
  if (emailInUse(fields.email)) return errorResponse(409, 'Conflict', 'A user with this email already exists.');

  const id = nextId++;
  const user = { id, ...fields };
  demoUsers.set(String(id), user);
  return { status: 201, statusText: 'Created', body: { message: 'User created successfully.', data: user }, location: `/api/users/${id}` };
}

function simulateUpdate(method, path, rawBody) {
  if (path === '/api/users') {
    return errorResponse(405, 'Method Not Allowed', `${method} requires an individual resource path: /api/users/{id}.`, null, 'POST');
  }
  const match = /^\/api\/users\/(\d+)$/.exec(path);
  if (!match) return errorResponse(404, 'Not Found', `${method} endpoint not found. Use /api/users/{id}.`);
  const id = match[1];
  const original = demoUsers.get(id);
  if (!original) return errorResponse(404, 'Not Found', `No user found with ID ${id}.`);

  const parsed = parseObject(rawBody);
  if (parsed.error) return parsed.error;
  const isPartial = method === 'PATCH';
  const errors = validateUserFields(parsed.payload, isPartial);
  if (errors.length) {
    return errorResponse(422, 'Unprocessable Content', `The ${method} request body contains validation errors.`, errors);
  }
  const fields = sanitizedFields(parsed.payload);
  const updated = isPartial ? { ...original, ...fields } : { id: original.id, ...fields };
  if (emailInUse(updated.email, id)) {
    return errorResponse(409, 'Conflict', 'A different user already has this email address.');
  }
  demoUsers.set(id, updated);
  return {
    status: 200,
    statusText: 'OK',
    body: { message: isPartial ? 'User partially updated.' : 'User replaced successfully.', data: updated },
    nextCheck: `Next QA check: GET /api/users/${id} to confirm the change. Try sending invalid data to confirm it does not overwrite the record.`
  };
}

function simulateDelete(path) {
  if (path === '/api/users') {
    return errorResponse(405, 'Method Not Allowed', 'DELETE requires /api/users/{id}, not the whole user collection.', null, 'POST');
  }
  const match = /^\/api\/users\/(\d+)$/.exec(path);
  if (!match) return errorResponse(404, 'Not Found', 'DELETE endpoint not found. Use /api/users/{id}.');
  const id = match[1];
  if (!demoUsers.has(id)) return errorResponse(404, 'Not Found', `No user found with ID ${id}.`);
  demoUsers.delete(id);
  return {
    status: 204,
    statusText: 'No Content',
    body: null,
    nextCheck: `Next QA check: GET /api/users/${id}. It should now return 404 Not Found. Repeating DELETE should also return 404.`
  };
}

const methodDescriptions = {
  GET: 'GET retrieves a fictional user by numeric ID. Check both successful lookups and 404 errors.',
  POST: 'POST creates a fictional user at /api/users. The JSON body requires name and email; role and active are optional.',
  PUT: 'PUT replaces an existing user at /api/users/{id}. Supply all four editable fields: name, email, role and active.',
  PATCH: 'PATCH modifies only the fields you supply for an existing user. Send at least one editable JSON field.',
  DELETE: 'DELETE removes an existing user. A successful deletion returns 204 No Content, with no JSON response body.'
};

const bodyHelp = {
  POST: 'POST /api/users: name and email are required. role defaults to customer, and active defaults to true.',
  PUT: 'PUT /api/users/{id}: supply name, email, role and active. This is a full replacement; omitted fields return 422.',
  PATCH: 'PATCH /api/users/{id}: supply one or more of name, email, role or active. Unspecified fields stay unchanged.'
};

function updateMethodUI() {
  const method = requestMethod.value;
  const usesBody = ['POST', 'PUT', 'PATCH'].includes(method);
  requestBodyGroup.hidden = !usesBody;
  // Empty bodies are intentionally allowed so the simulator can return HTTP 400.
  requestBody.required = false;
  requestBodyHelp.textContent = bodyHelp[method] || '';
  methodDescription.textContent = methodDescriptions[method];
}

function showResponse(method, path, response) {
  responseEmpty.hidden = true;
  responseContent.hidden = false;
  const success = response.status >= 200 && response.status < 300;
  responseStatus.className = `status-badge ${success ? 'status-success' : 'status-error'}`;
  responseStatus.textContent = `${response.status} ${response.statusText}`;
  lastRequest.textContent = `${method} ${path} · Simulated local response`;
  const noBody = response.status === 204;
  bodyHeading.textContent = noBody ? 'Response body' : 'JSON response body';
  bodyMediaType.textContent = noBody ? 'No content returned' : 'application/json';
  responseBody.textContent = noBody ? 'No response body (HTTP 204 No Content).' : JSON.stringify(response.body, null, 2);
  responseBody.setAttribute('aria-label', noBody ? 'No response body for HTTP 204' : 'JSON response body');
  responseHeaders.textContent = [
    ...(!noBody ? ['Content-Type: application/json; charset=utf-8'] : ['Content-Length: 0']),
    'Cache-Control: no-store',
    'X-Lab-Mode: simulated',
    ...(response.location ? [`Location: ${response.location}`] : []),
    ...(response.allow ? [`Allow: ${response.allow}`] : [])
  ].join('\n');
  const nextCheck = response.nextCheck || (response.location
    ? `Next QA check: switch to GET and request ${response.location} to retrieve the created user.` : '');
  responseTip.hidden = !nextCheck;
  responseTip.textContent = nextCheck ? `${nextCheck} Changes reset if you refresh this page.` : '';
  requestAnnouncement.textContent = `Simulated ${method} request complete. Response: ${response.status} ${response.statusText}.`;
}

requestMethod.addEventListener('change', () => {
  const method = requestMethod.value;
  const path = endpointInput.value.trim();
  if (method === 'POST') {
    if (/^\/api\/users\/\d+$/.test(path)) endpointInput.value = '/api/users';
    requestBody.value = exampleBodies.valid;
  } else {
    if (path === '/api/users') endpointInput.value = '/api/users/101';
    if (method === 'PUT') requestBody.value = exampleBodies.putValid;
    if (method === 'PATCH') requestBody.value = exampleBodies.patchRole;
  }
  updateMethodUI();
});

requestForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const path = endpointInput.value.trim();
  if (!path) {
    endpointInput.focus();
    return;
  }
  const method = requestMethod.value;
  let response;
  switch (method) {
    case 'GET': response = simulateGet(path); break;
    case 'POST': response = simulatePost(path, requestBody.value); break;
    case 'PUT':
    case 'PATCH': response = simulateUpdate(method, path, requestBody.value); break;
    case 'DELETE': response = simulateDelete(path); break;
    default: response = errorResponse(405, 'Method Not Allowed', 'Unsupported HTTP method.');
  }
  showResponse(method, path, response);
});

for (const example of document.querySelectorAll('[data-method][data-path]')) {
  example.addEventListener('click', () => {
    requestMethod.value = example.dataset.method;
    endpointInput.value = example.dataset.path;
    if (example.dataset.bodyExample) requestBody.value = exampleBodies[example.dataset.bodyExample];
    updateMethodUI();
    if (['POST', 'PUT', 'PATCH'].includes(requestMethod.value)) requestBody.focus();
    else endpointInput.focus();
  });
}

updateMethodUI();
