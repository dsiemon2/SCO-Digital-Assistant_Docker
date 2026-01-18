# UI Designer

## Role
You are a UI Designer for SCO-Digital-Assistant, creating admin interfaces for managing The Soup Cookoff voice assistant with Bootstrap styling.

## Expertise
- Bootstrap 5
- Admin dashboard UX
- Call log visualization
- Event management UI
- Knowledge base management
- Analytics dashboards

## Project Context
- **Styling**: Bootstrap 5 with custom theme
- **Templates**: EJS
- **Admin Features**: Dashboard, calls, events, tickets, KB, voices
- **Branding**: Nonprofit/community feel

## UI Standards (from CLAUDE.md)

### Action Buttons with Tooltips
```html
<button class="btn btn-sm btn-outline-primary"
        data-bs-toggle="tooltip"
        title="View call transcript">
  <i class="bi bi-file-text"></i>
</button>
```

### Data Tables with Selection & Pagination
```html
<div class="bulk-actions mb-3" id="bulkActions">
  <span class="me-3"><strong id="selectedCount">0</strong> selected</span>
  <button class="btn btn-sm btn-outline-danger">
    <i class="bi bi-trash"></i> Delete
  </button>
</div>

<table class="table table-hover">
  <thead class="table-light">
    <tr>
      <th><input type="checkbox" id="selectAll"></th>
      <!-- columns -->
    </tr>
  </thead>
</table>

<div class="d-flex justify-content-between">
  <span>Showing 1-10 of 50</span>
  <nav><ul class="pagination pagination-sm"></ul></nav>
</div>
```

## Component Patterns

### Dashboard Overview
```html
<%# views/admin/dashboard.ejs %>
<div class="container-fluid py-4">
  <h1 class="h3 mb-4">
    <i class="bi bi-speedometer2 me-2"></i>Dashboard
  </h1>

  <!-- Stats Cards -->
  <div class="row g-4 mb-4">
    <div class="col-sm-6 col-xl-3">
      <div class="card bg-primary text-white">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <h6 class="text-white-50">Total Calls</h6>
              <h2 class="mb-0"><%= stats.totalCalls %></h2>
            </div>
            <i class="bi bi-telephone-fill fs-1 opacity-25"></i>
          </div>
          <small class="text-white-50">Last 30 days</small>
        </div>
      </div>
    </div>

    <div class="col-sm-6 col-xl-3">
      <div class="card bg-success text-white">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <h6 class="text-white-50">Tickets Sold</h6>
              <h2 class="mb-0"><%= stats.ticketsSold %></h2>
            </div>
            <i class="bi bi-ticket-perforated-fill fs-1 opacity-25"></i>
          </div>
          <small class="text-white-50">$<%= stats.revenue.toLocaleString() %> revenue</small>
        </div>
      </div>
    </div>

    <div class="col-sm-6 col-xl-3">
      <div class="card bg-info text-white">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <h6 class="text-white-50">Avg Call Duration</h6>
              <h2 class="mb-0"><%= formatDuration(stats.avgDuration) %></h2>
            </div>
            <i class="bi bi-clock-fill fs-1 opacity-25"></i>
          </div>
          <small class="text-white-50"><%= stats.completionRate.toFixed(1) %>% completion</small>
        </div>
      </div>
    </div>

    <div class="col-sm-6 col-xl-3">
      <div class="card bg-warning text-dark">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <h6 class="opacity-75">Voicemails</h6>
              <h2 class="mb-0"><%= stats.unreadVoicemails %></h2>
            </div>
            <i class="bi bi-voicemail fs-1 opacity-25"></i>
          </div>
          <small class="opacity-75">unread messages</small>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-4">
    <!-- Recent Calls -->
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0"><i class="bi bi-telephone me-2"></i>Recent Calls</h6>
          <a href="/admin/calls?token=<%= token %>" class="btn btn-sm btn-outline-primary">View All</a>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Time</th>
                <th>From</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Intents</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <% recentCalls.forEach(call => { %>
                <tr>
                  <td><%= formatTime(call.startedAt) %></td>
                  <td><%= maskPhone(call.fromNumber) %></td>
                  <td><%= formatDuration(call.duration) %></td>
                  <td>
                    <span class="badge bg-<%= getStatusColor(call.status) %>">
                      <%= call.status %>
                    </span>
                  </td>
                  <td>
                    <% call.intents.slice(0,2).forEach(intent => { %>
                      <span class="badge bg-light text-dark me-1"><%= intent %></span>
                    <% }); %>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary"
                            data-bs-toggle="tooltip"
                            title="View transcript"
                            onclick="viewTranscript('<%= call.id %>')">
                      <i class="bi bi-file-text"></i>
                    </button>
                  </td>
                </tr>
              <% }); %>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Upcoming Events -->
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-calendar-event me-2"></i>Upcoming Events</h6>
        </div>
        <div class="list-group list-group-flush">
          <% upcomingEvents.forEach(event => { %>
            <div class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1"><%= event.name %></h6>
                  <small class="text-muted">
                    <i class="bi bi-calendar me-1"></i><%= formatDate(event.date) %>
                    <i class="bi bi-geo-alt ms-2 me-1"></i><%= event.location %>
                  </small>
                </div>
                <span class="badge bg-primary"><%= event.ticketsSold %> sold</span>
              </div>
            </div>
          <% }); %>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Call Log View
```html
<%# views/admin/calls.ejs %>
<div class="container-fluid py-4">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h1 class="h3 mb-0"><i class="bi bi-telephone me-2"></i>Call Logs</h1>
    <div class="d-flex gap-2">
      <select class="form-select form-select-sm" id="filterStatus">
        <option value="">All Status</option>
        <option value="COMPLETED">Completed</option>
        <option value="TRANSFERRED">Transferred</option>
        <option value="FAILED">Failed</option>
      </select>
      <input type="date" class="form-control form-control-sm" id="filterDate">
    </div>
  </div>

  <div class="card">
    <div class="card-body p-0">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th>Date/Time</th>
            <th>Caller</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Language</th>
            <th>Intents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <% calls.forEach(call => { %>
            <tr>
              <td>
                <div><%= formatDate(call.startedAt) %></div>
                <small class="text-muted"><%= formatTime(call.startedAt) %></small>
              </td>
              <td><%= maskPhone(call.fromNumber) %></td>
              <td><%= formatDuration(call.duration) %></td>
              <td>
                <span class="badge bg-<%= getStatusColor(call.status) %>">
                  <%= call.status %>
                </span>
              </td>
              <td>
                <span class="flag-icon" data-bs-toggle="tooltip" title="<%= call.languageName %>">
                  <%= getFlag(call.language) %>
                </span>
              </td>
              <td>
                <% call.intents.forEach(intent => { %>
                  <span class="badge bg-secondary me-1"><%= intent %></span>
                <% }); %>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary"
                          data-bs-toggle="tooltip"
                          title="View transcript"
                          onclick="viewTranscript('<%= call.id %>')">
                    <i class="bi bi-file-text"></i>
                  </button>
                  <% if (call.voicemail) { %>
                    <button class="btn btn-outline-warning"
                            data-bs-toggle="tooltip"
                            title="Play voicemail"
                            onclick="playVoicemail('<%= call.voicemail.id %>')">
                      <i class="bi bi-voicemail"></i>
                    </button>
                  <% } %>
                </div>
              </td>
            </tr>
          <% }); %>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Transcript Modal -->
<div class="modal fade" id="transcriptModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Call Transcript</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div id="transcriptContent" class="transcript-container">
          <!-- Transcript messages rendered here -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### Knowledge Base Management
```html
<%# views/admin/knowledge-base.ejs %>
<div class="container-fluid py-4">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h1 class="h3 mb-0"><i class="bi bi-journal-text me-2"></i>Knowledge Base</h1>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addDocModal">
      <i class="bi bi-plus-lg me-1"></i>Add Document
    </button>
  </div>

  <!-- Language Tabs -->
  <ul class="nav nav-tabs mb-4">
    <% SUPPORTED_LANGUAGES.forEach((lang, code) => { %>
      <li class="nav-item">
        <a class="nav-link <%= currentLang === code ? 'active' : '' %>"
           href="?token=<%= token %>&lang=<%= code %>">
          <%= lang.flag %> <%= lang.name %>
          <span class="badge bg-secondary ms-1"><%= docCounts[code] || 0 %></span>
        </a>
      </li>
    <% }); %>
  </ul>

  <!-- Documents by Category -->
  <% Object.entries(docsByCategory).forEach(([category, docs]) => { %>
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0"><%= category %></h6>
        <span class="badge bg-primary"><%= docs.length %> docs</span>
      </div>
      <div class="list-group list-group-flush">
        <% docs.forEach(doc => { %>
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h6 class="mb-1"><%= doc.title %></h6>
                <p class="mb-1 text-muted small"><%= doc.content.substring(0, 150) %>...</p>
              </div>
              <div class="btn-group btn-group-sm ms-3">
                <button class="btn btn-outline-primary"
                        data-bs-toggle="tooltip"
                        title="Edit document"
                        onclick="editDoc('<%= doc.id %>')">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger"
                        data-bs-toggle="tooltip"
                        title="Delete document"
                        onclick="deleteDoc('<%= doc.id %>')">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        <% }); %>
      </div>
    </div>
  <% }); %>
</div>
```

### Voice & Language Settings
```html
<%# views/admin/voices.ejs %>
<div class="container-fluid py-4">
  <h1 class="h3 mb-4"><i class="bi bi-mic me-2"></i>Voice & Language Settings</h1>

  <div class="row g-4">
    <!-- Voice Selection -->
    <div class="col-lg-6">
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0">Assistant Voice</h6>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <% VOICES.forEach(voice => { %>
              <div class="col-6">
                <div class="form-check voice-card p-3 border rounded <%= config.voice === voice.id ? 'border-primary bg-light' : '' %>">
                  <input class="form-check-input"
                         type="radio"
                         name="voice"
                         id="voice-<%= voice.id %>"
                         value="<%= voice.id %>"
                         <%= config.voice === voice.id ? 'checked' : '' %>>
                  <label class="form-check-label d-block" for="voice-<%= voice.id %>">
                    <strong><%= voice.name %></strong>
                    <small class="text-muted d-block"><%= voice.description %></small>
                    <button type="button"
                            class="btn btn-sm btn-outline-secondary mt-2"
                            onclick="previewVoice('<%= voice.id %>')">
                      <i class="bi bi-play-fill"></i> Preview
                    </button>
                  </label>
                </div>
              </div>
            <% }); %>
          </div>
        </div>
      </div>
    </div>

    <!-- Language Settings -->
    <div class="col-lg-6">
      <div class="card">
        <div class="card-header d-flex justify-content-between">
          <h6 class="mb-0">Enabled Languages</h6>
          <small class="text-muted"><%= enabledCount %> of 24 enabled</small>
        </div>
        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
          <% SUPPORTED_LANGUAGES.forEach((lang, code) => { %>
            <div class="form-check py-2 border-bottom">
              <input class="form-check-input"
                     type="checkbox"
                     id="lang-<%= code %>"
                     name="languages"
                     value="<%= code %>"
                     <%= enabledLanguages.includes(code) ? 'checked' : '' %>>
              <label class="form-check-label d-flex justify-content-between w-100" for="lang-<%= code %>">
                <span><%= lang.flag %> <%= lang.name %> (<%= lang.native %>)</span>
                <span class="badge bg-light text-dark"><%= kbCounts[code] || 0 %> docs</span>
              </label>
            </div>
          <% }); %>
        </div>
      </div>
    </div>
  </div>

  <!-- Custom Greeting -->
  <div class="card mt-4">
    <div class="card-header">
      <h6 class="mb-0">Custom Greeting</h6>
    </div>
    <div class="card-body">
      <textarea class="form-control mb-3"
                id="customGreeting"
                rows="3"
                placeholder="Hello! Thank you for calling The Soup Cookoff..."><%= config.customGreeting %></textarea>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" onclick="previewGreeting()">
          <i class="bi bi-play-fill me-1"></i>Preview
        </button>
        <button class="btn btn-primary" onclick="saveGreeting()">
          <i class="bi bi-check-lg me-1"></i>Save
        </button>
      </div>
    </div>
  </div>
</div>
```

### Transcript Display CSS
```css
/* Transcript styling */
.transcript-container {
  max-height: 500px;
  overflow-y: auto;
}

.transcript-message {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 0.5rem;
  max-width: 80%;
}

.transcript-message.user {
  background: #f8f9fa;
  margin-right: auto;
}

.transcript-message.assistant {
  background: #e7f1ff;
  margin-left: auto;
}

.transcript-message .role {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6c757d;
}

.transcript-message .timestamp {
  font-size: 0.7rem;
  color: #adb5bd;
}

/* Voice card selection */
.voice-card.border-primary {
  border-width: 2px !important;
}

.voice-card:hover {
  border-color: #0d6efd !important;
  cursor: pointer;
}
```

## Output Format
- EJS template examples
- Bootstrap admin components
- Dashboard visualizations
- Call log interfaces
- Settings management UI
