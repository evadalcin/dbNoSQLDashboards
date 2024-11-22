document.addEventListener('DOMContentLoaded', function() {
    const databaseSelect = document.getElementById('databaseSelect');
    const collectionSelect = document.getElementById('collectionSelect');
    const fieldsContainer = document.getElementById('fieldsContainer');
    const fieldsList = document.getElementById('fieldsList');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    const documentsTable = document.getElementById('documentsTable');
    const documentsBody = document.getElementById('documentsBody');
    const createDocumentBtn = document.getElementById('createDocumentBtn');
    const updateDocumentBtn = document.getElementById('updateDocumentBtn');
    const deleteDocumentBtn = document.getElementById('deleteDocumentBtn');

    let selectedDocId = null;

    fetchDatabases();

    function fetchDatabases() {
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        fetch('/api/databases')
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                if (data.length === 0) {
                    errorMessage.textContent = 'No databases found!';
                    error.classList.remove('hidden');
                } else {
                    data.forEach(db => {
                        const option = document.createElement('option');
                        option.value = db;
                        option.textContent = db;
                        databaseSelect.appendChild(option);
                    });
                }
            })
            .catch(err => {
                loading.classList.add('hidden');
                errorMessage.textContent = 'Failed to fetch databases';
                error.classList.remove('hidden');
                console.error(err);
            });
    }

    databaseSelect.addEventListener('change', function() {
        const dbName = this.value;
        if (dbName) {
            fetchCollections(dbName);
        } else {
            collectionSelect.innerHTML = '<option value="">Select a collection</option>';
            createDocumentBtn.classList.add('hidden'); // Hide the button if no db is selected
        }
    });

    function fetchCollections(dbName) {
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        fetch(`/api/collections/${dbName}`)
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                collectionSelect.innerHTML = '<option value="">Select a collection</option>';
                data.forEach(collection => {
                    const option = document.createElement('option');
                    option.value = collection;
                    option.textContent = collection;
                    collectionSelect.appendChild(option);
                });
            })
            .catch(err => {
                loading.classList.add('hidden');
                errorMessage.textContent = 'Failed to fetch collections';
                error.classList.remove('hidden');
                console.error(err);
            });
    }

    collectionSelect.addEventListener('change', function() {
        const dbName = databaseSelect.value;
        const collectionName = this.value;
        if (dbName && collectionName) {
            fetchFields(dbName, collectionName);
            fetchDocuments(dbName, collectionName);
            createDocumentBtn.classList.remove('hidden'); // Show button after selecting both DB and collection
        } else {
            fieldsContainer.classList.add('hidden');
            documentsTable.classList.add('hidden');
            createDocumentBtn.classList.add('hidden'); // Hide button if collection is not selected
        }
    });

    function fetchFields(dbName, collectionName) {
        fetch(`/api/collections/${dbName}/${collectionName}/documents`)
            .then(response => response.json())
            .then(documents => {
                if (documents.length > 0) {
                    const firstDocument = documents[0];
                    const fields = Object.keys(firstDocument).filter(field => field !== '_id');
                    fieldsList.innerHTML = '';

                    fields.forEach(field => {
                        const div = document.createElement('div');
                        div.classList.add('mb-4');
                        div.innerHTML = `
                            <label class="label"><span class="label-text">${field}</span></label>
                            <input type="text" name="${field}" class="input input-bordered w-full" placeholder="Enter ${field}" />
                        `;
                        fieldsList.appendChild(div);
                    });

                    fieldsContainer.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error('Error fetching fields:', err);
            });
    }

    function fetchDocuments(dbName, collectionName) {
        loading.classList.remove('hidden');
        fetch(`/api/collections/${dbName}/${collectionName}/documents`)
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                documentsBody.innerHTML = '';
                if (data.length === 0) {
                    documentsTable.classList.add('hidden');
                } else {
                    documentsTable.classList.remove('hidden');
                    data.forEach(doc => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${doc._id}</td>
                            <td>${JSON.stringify(doc)}</td>
                            <td>
                                <button class="btn btn-warning btn-sm" onclick="editDocument('${doc._id}')">Edit</button>
                                <button class="btn btn-error btn-sm" onclick="deleteDocument('${doc._id}')">Delete</button>
                            </td>
                        `;
                        documentsBody.appendChild(row);
                    });
                }
            })
            .catch(err => {
                loading.classList.add('hidden');
                errorMessage.textContent = 'Failed to fetch documents';
                error.classList.remove('hidden');
                console.error(err);
            });
    }

    window.editDocument = function(docId) {
        selectedDocId = docId;
        updateDocumentBtn.classList.remove('hidden');
        deleteDocumentBtn.classList.remove('hidden');
        createDocumentBtn.classList.add('hidden');
        const dbName = databaseSelect.value;
        const collectionName = collectionSelect.value;
        fetch(`/api/collections/${dbName}/${collectionName}/documents/${docId}`)
            .then(response => response.json())
            .then(doc => {
                document.querySelectorAll('#fieldsList input').forEach(input => {
                    const fieldName = input.name;
                    if (doc[fieldName]) {
                        input.value = doc[fieldName];
                    }
                });
            })
            .catch(err => {
                console.error('Error fetching document:', err);
            });
    };

    window.deleteDocument = function(docId) {
        const dbName = databaseSelect.value;
        const collectionName = collectionSelect.value;
        fetch(`/api/collections/${dbName}/${collectionName}/documents/${docId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.deleted_count > 0) {
                alert('Document deleted successfully');
                fetchDocuments(dbName, collectionName);
            }
        })
        .catch(err => {
            console.error('Error deleting document:', err);
        });
    };

    createDocumentBtn.addEventListener('click', function() {
        const dbName = databaseSelect.value;
        const collectionName = collectionSelect.value;
        const formData = {};
        document.querySelectorAll('#fieldsList input').forEach(input => {
            formData[input.name] = input.value;
        });

        fetch(`/api/collections/${dbName}/${collectionName}/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(result => {
            alert('Document created successfully');
            fetchDocuments(dbName, collectionName);
        })
        .catch(err => {
            console.error('Error creating document:', err);
        });
    });

    updateDocumentBtn.addEventListener('click', function() {
        const dbName = databaseSelect.value;
        const collectionName = collectionSelect.value;
        const formData = {};
        document.querySelectorAll('#fieldsList input').forEach(input => {
            formData[input.name] = input.value;
        });

        fetch(`/api/collections/${dbName}/${collectionName}/documents/${selectedDocId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(result => {
            alert('Document updated successfully');
            fetchDocuments(dbName, collectionName);
        })
        .catch(err => {
            console.error('Error updating document:', err);
        });
    });
});
