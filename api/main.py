from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

# route that receives the data to run the individual node
@app.post("/graph")
async def get_graph():
    # get data from request
    data = await request.json()

    # get graph from data (should include the node name, input data and expected output)
    node_name = data.get("node_name")
    input_data = data.get("input_data")

    # run graph

    return {"message": "Graph", "result": result}


@app.get("/health")
async def health():
    return {"status": "healthy"}

