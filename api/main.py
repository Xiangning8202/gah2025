from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

# route that receives the data to run the individual node
@app.post("/graph")
async def get_graph(request: Request):
    # get data from request
    data = await request.json()
    print(data)
    # get graph from data (should include the node name, input data and expected output)
    node_name = data.get("node_name")
    input_data = data.get("input_data")

    # run graph
    # TODO: Implement your graph logic here
    result = f"Processed node '{node_name}' with input: {input_data}"

    return {"message": "Graph", "result": result}


@app.get("/health")
async def health():
    return {"status": "healthy"}

