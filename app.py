from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)

client = MongoClient("mongodb://localhost:27017/")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/databases', methods=['GET'])
def get_databases():
    dbs = client.list_database_names()
    return jsonify(dbs)

@app.route('/api/collections/<db_name>', methods=['GET'])
def get_collections(db_name):
    database = client[db_name]
    collections = database.list_collection_names()
    return jsonify(collections)

@app.route('/api/collections/<db_name>/<collection_name>/fields', methods=['GET'])
def get_fields(db_name, collection_name):
    collection = client[db_name][collection_name]
    first_document = collection.find_one()
    if first_document:
        fields = list(first_document.keys())
    else:
        fields = []
    return jsonify(fields)

@app.route('/api/collections/<db_name>/<collection_name>/documents', methods=['GET'])
def get_documents(db_name, collection_name):
    collection = client[db_name][collection_name]
    documents = list(collection.find())
    for doc in documents:
        doc['_id'] = str(doc['_id'])
    return jsonify(documents)

@app.route('/api/collections/<db_name>/<collection_name>/documents', methods=['POST'])
def create_document(db_name, collection_name):
    data = request.get_json()
    collection = client[db_name][collection_name]
    result = collection.insert_one(data)
    return jsonify({"inserted_id": str(result.inserted_id)})

@app.route('/api/collections/<db_name>/<collection_name>/documents/<doc_id>', methods=['PUT'])
def update_document(db_name, collection_name, doc_id):
    data = request.get_json()
    collection = client[db_name][collection_name]
    result = collection.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": data}
    )
    return jsonify({"matched_count": result.matched_count, "modified_count": result.modified_count})

@app.route('/api/collections/<db_name>/<collection_name>/documents/<doc_id>', methods=['DELETE'])
def delete_document(db_name, collection_name, doc_id):
    collection = client[db_name][collection_name]
    result = collection.delete_one({"_id": ObjectId(doc_id)})
    return jsonify({"deleted_count": result.deleted_count})

if __name__ == '__main__':
    app.run(debug=True)
