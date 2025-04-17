// Add this to the top of your script.js file
// filepath: c:\Users\HP\.vscode\Simulation\script.js
// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Call this when the page loads
window.addEventListener('load', checkAuth);
// Handle archiving a file
async function handleArchive(fileId) {
    try {
        console.log(`Archiving file with ID: ${fileId}`);
        const response = await fetch(`http://localhost:8080/api/files/${fileId}/archive`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to archive file');
        }

        alert('File archived successfully');

        // Move the file to the archived section
        console.log(`Calling moveFileToArchivedSection for file ID: ${fileId}`);
        moveFileToArchivedSection(fileId);
    } catch (error) {
        console.error('Error archiving file:', error);
        alert('Error archiving file.');
    }
}

// Move file to the archived section
function moveFileToArchivedSection(fileId) {
    // Find the file element in the "Files" section
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileElement) {
        console.error(`File with ID ${fileId} not found in the Files section.`);
        return;
    }

    // Get the category of the file
    const category = fileElement.closest('ul').id.replace('-files', '');
    const archivedCategoryList = document.getElementById(`archived-${category}-files`);
    if (!archivedCategoryList) {
        console.error(`Archived category list for ${category} not found.`);
        return;
    }

    // Create a new list item for the archived file
    const archivedItem = document.createElement('li');
    archivedItem.setAttribute('data-file-id', fileId);

    // Copy the file name
    const fileName = fileElement.querySelector('.file-name').textContent;
    const fileNameElement = document.createElement('span');
    fileNameElement.className = 'file-name';
    fileNameElement.textContent = fileName;

    // Create actions container with download and delete buttons only
    const actions = document.createElement('div');
    actions.className = 'file-actions';
    actions.innerHTML = `
        <button class="download-btn" onclick="handleDownload('${fileId}')" title="Download">
            <i class="fa-solid fa-download"></i>
        </button>
        <button class="delete-btn" onclick="handleDelete('${fileId}')" title="Delete">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    // Add the elements to the archived item
    archivedItem.appendChild(fileNameElement);
    archivedItem.appendChild(actions);

    // Add the archived item to the archived category list
    archivedCategoryList.appendChild(archivedItem);

    // Instead of removing the original file, make it inactive
    fileElement.classList.add('inactive-file');
    
    // Disable all buttons in the original file
    const originalButtons = fileElement.querySelectorAll('.file-actions button');
    originalButtons.forEach(button => {
        button.disabled = true;
    });

    console.log(`File with ID ${fileId} moved to archived category: ${category}`);
}

// Handle deleting a file
async function handleDelete(fileId) {
    try {
        const response = await fetch(`http://localhost:8080/api/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete file');
        }
        
        alert('File deleted successfully');
        location.reload(); // Reload to update the file list after deletion
    } catch (error) {
        console.error('Error deleting file:', error);
        alert('Error deleting file.');
    }
}

// Handle file upload
document.getElementById('upload-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const fileCategory = document.getElementById('file-category').value; // Ensure ID matches HTML
    const file = fileInput.files[0];
    
    if (!file) return alert('Please select a file.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', fileCategory);

    try {
        const response = await fetch('http://localhost:8080/api/files/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload file');

        const fileInfo = await response.json();

        // Corrected: use fileCategory variable (not file-category)
        addFileToCategory(fileCategory, fileInfo);

        alert('File uploaded successfully!');
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file.');
    }
});

// Add file to the appropriate category list
function addFileToCategory(category, fileInfo) {
    const categoryList = document.getElementById(`${category}-files`);
    if (!categoryList) return;

    const listItem = document.createElement('li');
    
    // Create file name element
    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = fileInfo.name;
    
    // Create actions container with download, archive, and delete buttons
    const actions = document.createElement('div');
    actions.className = 'file-actions';
    actions.innerHTML = `
        <button class="download-btn" onclick="handleDownload('${fileInfo.id}')" title="Download">
            <i class="fa-solid fa-download"></i>
        </button>
        <button class="archive-btn" onclick="handleArchive('${fileInfo.id}')" title="Archive">
            <i class="fa-solid fa-cloud"></i>
        </button>
        <button class="delete-btn" onclick="handleDelete('${fileInfo.id}')" title="Delete">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    
    listItem.appendChild(fileName);
    listItem.appendChild(actions);
    listItem.setAttribute('data-file-id', fileInfo.id);
    categoryList.appendChild(listItem);
}

// Toggle dropdown visibility for category lists
document.querySelectorAll('.category-toggle').forEach(button => {
    button.addEventListener('click', function () {
        const category = this.dataset.category;
        const dropdown = document.getElementById(`${category}-files`);
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
});

document.querySelectorAll('.toggle-link').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const targetId = link.getAttribute('data-target');
        const dropdown = document.getElementById(targetId);
        if (dropdown.style.display === 'none') {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    });
});

// Fetch and display all files grouped by category
async function fetchFiles() {
    try {
        // Cache busting added by appending a query parameter properly
        const response = await fetch('http://localhost:8080/api/files/categories?t=' + new Date().getTime());
        if (!response.ok) throw new Error('Failed to fetch files');
        
        const categorizedFiles = await response.json();
        // Expected format: { category1: [files], category2: [files], ... }
        
        Object.entries(categorizedFiles).forEach(([category, files]) => {
            const categoryList = document.getElementById(`${category}-files`);
            if (categoryList) {
                // Clear existing items if needed
                categoryList.innerHTML = `<h3>${category === 'archived' ? 'Archived Files' : category + ' Files'}</h3>`;
                files.forEach(file => {
                    addFileToCategory(category, file);
                });
                categoryList.style.display = 'block';
            }
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        alert('Error fetching files.');
    }
}

async function handleDownload(fileId) {
    // Redirect the browser to the download endpoint
    window.location.href = `http://localhost:8080/api/files/download/${fileId}`;
}

async function uploadFile(file, category) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch('http://localhost:8080/api/files/upload', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
}

// Load files on page load
window.onload = fetchFiles;
