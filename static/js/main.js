document.addEventListener('DOMContentLoaded', function() {
    const mongoDatabaseSelect = document.getElementById('mongoDatabaseSelect');
    const mongoCollectionSelect = document.getElementById('mongoCollectionSelect');
    const mongoFieldsList = document.getElementById('mongoFieldsList');
    const mongoDocumentsBody = document.getElementById('mongoDocumentsBody');
    const createMongoDocumentBtn = document.getElementById('createMongoDocumentBtn');
    const updateMongoDocumentBtn = document.getElementById('updateMongoDocumentBtn');
    const deleteMongoDocumentBtn = document.getElementById('deleteMongoDocumentBtn');

    const redisKeyInput = document.getElementById('redisKeyInput');
    const redisValueInput = document.getElementById('redisValueInput');
    const createRedisKeyBtn = document.getElementById('createRedisKeyBtn');
    const deleteRedisKeyBtn = document.getElementById('deleteRedisKeyBtn');
    const redisKeysBody = document.getElementById('redisKeysBody');

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');

    const mongoSection = document.getElementById('mongoSection');
    const redisSection = document.getElementById('redisSection');

    let selectedMongoDocId = null;

    function handleError(err) {
        loading.classList.add('hidden');
        errorMessage.textContent = err.message || 'An error occurred';
        error.classList.remove('hidden');
        console.error(err);
    }

    window.showMongoSection = function() {
        mongoSection.classList.remove('hidden');
        redisSection.classList.add('hidden');
        fetchMongoDatabases();
    };

    window.showRedisSection = function() {
        mongoSection.classList.add('hidden');
        redisSection.classList.remove('hidden');
        fetchRedisKeys();
    };

    function fetchMongoDatabases() {
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        fetch('/api/mongo/databases')
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                mongoDatabaseSelect.innerHTML = '<option value="">Select a database</option>';
                data.forEach(db => {
                    const option = document.createElement('option');
                    option.value = db;
                    option.textContent = db;
                    mongoDatabaseSelect.appendChild(option);
                });
            })
            .catch(handleError);
    }

    mongoDatabaseSelect.addEventListener('change', function() {
        const dbName = this.value;
        if (dbName) {
            fetchMongoCollections(dbName);
        }
    });

    function fetchMongoCollections(dbName) {
        loading.classList.remove('hidden');
        fetch(`/api/mongo/collections/${dbName}`)
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                mongoCollectionSelect.innerHTML = '<option value="">Select a collection</option>';
                data.forEach(collection => {
                    const option = document.createElement('option');
                    option.value = collection;
                    option.textContent = collection;
                    mongoCollectionSelect.appendChild(option);
                });
            })
            .catch(handleError);
    }

    function updateMongoFormFields(documents) {
        mongoFieldsList.innerHTML = '';
        if (documents.length > 0) {
            const firstDoc = documents[0];
            const fields = Object.keys(firstDoc).filter(field => field !== '_id');

            fields.forEach(field => {
                const div = document.createElement('div');
                div.classList.add('form-control', 'mb-4');
                div.innerHTML = `
                    <label class="label">
                        <span class="label-text">${field}</span>
                    </label>
                    <input type="text" id="mongo${field}" name="${field}" placeholder="Enter ${field}"
                           class="input input-bordered w-full"/>
                `;
                mongoFieldsList.appendChild(div);
            });

            createMongoDocumentBtn.classList.remove('hidden');
        }
    }

    mongoCollectionSelect.addEventListener('change', function() {
        const dbName = mongoDatabaseSelect.value;
        const collectionName = this.value;
        if (dbName && collectionName) {
            fetchMongoDocuments(dbName, collectionName);
        }
    });

    function fetchMongoDocuments(dbName, collectionName) {
        loading.classList.remove('hidden');
        fetch(`/api/mongo/collections/${dbName}/${collectionName}/documents`)
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                mongoDocumentsBody.innerHTML = '';
                data.forEach(doc => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${doc._id}</td>
                        <td>${JSON.stringify(doc)}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editMongoDocument('${doc._id}')">Edit</button>
                            <button class="btn btn-error btn-sm" onclick="deleteMongoDocument('${doc._id}')">Delete</button>
                        </td>
                    `;
                    mongoDocumentsBody.appendChild(row);
                });
                updateMongoFormFields(data);
            })
            .catch(handleError);
    }

    window.editMongoDocument = function(docId) {
        selectedMongoDocId = docId;
        const dbName = mongoDatabaseSelect.value;
        const collectionName = mongoCollectionSelect.value;

        updateMongoDocumentBtn.classList.remove('hidden');
        deleteMongoDocumentBtn.classList.remove('hidden');
        createMongoDocumentBtn.classList.add('hidden');
    };

    window.deleteMongoDocument = function(docId) {
        const dbName = mongoDatabaseSelect.value;
        const collectionName = mongoCollectionSelect.value;

        fetch(`/api/mongo/collections/${dbName}/${collectionName}/documents/${docId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.deleted_count > 0) {
                alert('Document deleted successfully');
                fetchMongoDocuments(dbName, collectionName);
            }
        })
        .catch(handleError);
    };

    createMongoDocumentBtn.addEventListener('click', function() {
        const dbName = mongoDatabaseSelect.value;
        const collectionName = mongoCollectionSelect.value;
        const formData = {};

        mongoFieldsList.querySelectorAll('input').forEach(input => {
            if (input.value.trim()) {
                formData[input.name] = input.value;
            }
        });

        fetch(`/api/mongo/collections/${dbName}/${collectionName}/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(result => {
            alert('Document created successfully');
            fetchMongoDocuments(dbName, collectionName);
        })
        .catch(handleError);
    });

    updateMongoDocumentBtn.addEventListener('click', function() {
        const dbName = mongoDatabaseSelect.value;
        const collectionName = mongoCollectionSelect.value;
        const formData = {};

        mongoFieldsList.querySelectorAll('input').forEach(input => {
            if (input.value.trim()) {
                formData[input.name] = input.value;
            }
        });

        fetch(`/api/mongo/collections/${dbName}/${collectionName}/documents/${selectedMongoDocId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(result => {
            alert('Document updated successfully');
            fetchMongoDocuments(dbName, collectionName);
        })
        .catch(handleError);
    });

    // Redis Functions
    function fetchRedisKeys() {
        loading.classList.remove('hidden');
        fetch('/api/redis/keys')
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                redisKeysBody.innerHTML = '';
                data.forEach(key => {
                    fetch(`/api/redis/key/${key}`)
                        .then(keyResponse => keyResponse.json())
                        .then(keyData => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${key}</td>
                                <td>${JSON.stringify(keyData.value)}</td>
                                <td>
                                    <button class="btn btn-warning btn-sm" onclick="editRedisKey('${key}')">Edit</button>
                                    <button class="btn btn-error btn-sm" onclick="deleteRedisKey('${key}')">Delete</button>
                                </td>
                            `;
                            redisKeysBody.appendChild(row);
                        });
                });
            })
            .catch(handleError);
    }

    window.editRedisKey = function(key) {
        fetch(`/api/redis/key/${key}`)
            .then(response => response.json())
            .then(data => {
                redisKeyInput.value = key;
                redisValueInput.value = JSON.stringify(data.value, null, 2);
            })
            .catch(handleError);
    };

    window.deleteRedisKey = function(key) {
        fetch(`/api/redis/key/${key}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.deleted_count > 0) {
                alert('Key deleted successfully');
                fetchRedisKeys();
            }
        })
        .catch(handleError);
    };

    createRedisKeyBtn.addEventListener('click', function() {
        const key = redisKeyInput.value.trim();
        const value = redisValueInput.value.trim();

        try {
            const parsedValue = JSON.parse(value);
            fetch('/api/redis/key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key, value: parsedValue })
            })
            .then(response => response.json())
            .then(result => {
                alert('Key created/updated successfully');
                fetchRedisKeys();
            })
            .catch(handleError);
        } catch {
            // If not JSON, treat as string
            fetch('/api/redis/key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key, value })
            })
            .then(response => response.json())
            .then(result => {
                alert('Key created/updated successfully');
                fetchRedisKeys();
            })
            .catch(handleError);
        }
    });

    showMongoSection();
});