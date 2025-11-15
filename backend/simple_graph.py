from langgraph.graph import StateGraph, START, END

from graph_helper import build_callable_graph
# from get_graph import get_graph

graph = StateGraph(dict)


def step1(state):
    return {"foo": "bar"}


def step2(state):
    return {"baz": state["foo"]}


# add nodes
graph.add_node("step1", step1)
graph.add_node("step2", step2)

# simple linear graph
graph.add_edge(START, "step1")  # START -> step1
graph.add_edge("step1", "step2")  # step1 -> step2
graph.add_edge("step2", END)  # step2 -> END


def build():
    compiled_graph = graph.compile()
    build_callable_graph(compiled_graph)


if __name__ == "__main__":
    build()
