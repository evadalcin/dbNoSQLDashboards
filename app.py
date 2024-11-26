from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
import redis
import json

app = Flask(__name__)

mongo_client = MongoClient("mongodb://localhost:27017/")

redis_client = redis.Redis(host='127.0.0.1', port=6379,db=0)


@app.route('/')
def index():
    return render_template('index.html')


# MongoDB Routes
@app.route('/api/mongo/databases', methods=['GET'])
def get_mongo_databases():
    dbs = mongo_client.list_database_names()
    return jsonify(dbs)


@app.route('/api/mongo/collections/<db_name>', methods=['GET'])
def get_mongo_collections(db_name):
    database = mongo_client[db_name]
    collections = database.list_collection_names()
    return jsonify(collections)


@app.route('/api/mongo/collections/<db_name>/<collection_name>/documents', methods=['GET'])
def get_mongo_documents(db_name, collection_name):
    collection = mongo_client[db_name][collection_name]
    documents = list(collection.find())
    for doc in documents:
        doc['_id'] = str(doc['_id'])
    return jsonify(documents)


@app.route('/api/mongo/collections/<db_name>/<collection_name>/documents', methods=['POST'])
def create_mongo_document(db_name, collection_name):
    data = request.get_json()
    collection = mongo_client[db_name][collection_name]
    result = collection.insert_one(data)
    return jsonify({"inserted_id": str(result.inserted_id)})


@app.route('/api/mongo/collections/<db_name>/<collection_name>/documents/<doc_id>', methods=['PUT'])
def update_mongo_document(db_name, collection_name, doc_id):
    data = request.get_json()
    collection = mongo_client[db_name][collection_name]
    result = collection.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": data}
    )
    return jsonify({"matched_count": result.matched_count, "modified_count": result.modified_count})


@app.route('/api/mongo/collections/<db_name>/<collection_name>/documents/<doc_id>', methods=['DELETE'])
def delete_mongo_document(db_name, collection_name, doc_id):
    collection = mongo_client[db_name][collection_name]
    result = collection.delete_one({"_id": ObjectId(doc_id)})
    return jsonify({"deleted_count": result.deleted_count})

@app.route('/api/redis/keys', methods=['GET'])
def get_redis_keys():
    keys = redis_client.keys('*')
    return jsonify([key.decode('utf-8') for key in keys])

@app.route('/api/redis/key/<key>', methods=['GET'])
def get_redis_key(key):
    value = redis_client.get(key)
    if value is None:
        return jsonify({"error": "Key not found"}), 404

    if isinstance(value, bytes):
        try:
            parsed_value = json.loads(value.decode('utf-8'))
            return jsonify({"key": key, "value": parsed_value, "type": "json"})
        except:
            return jsonify({"key": key, "value": value.decode('utf-8'), "type": "string"})

    return jsonify({"key": key, "value": value, "type": "string"})

@app.route('/api/redis/key', methods=['POST'])
def create_redis_key():
    data = request.get_json()
    key = data.get('key')
    value = data.get('value')

    try:
        if isinstance(value, dict):
            redis_client.set(key, json.dumps(value))
        else:
            redis_client.set(key, str(value))
        return jsonify({"status": "success", "key": key})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route('/api/redis/key/<key>', methods=['DELETE'])
def delete_redis_key(key):
    result = redis_client.delete(key)
    return jsonify({"deleted_count": result})


if __name__ == '__main__':
    app.run(debug=True)