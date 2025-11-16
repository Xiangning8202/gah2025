from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from lantern import build_callable_graph


class State(TypedDict, total=False):
    counter: int
    result: str


graph = StateGraph(State)


def step1(state: State) -> State:
    # initialize counter
    return {"counter": 1}


def step2(state: State) -> State:
    # increment counter
    return {"counter": state["counter"] + 1}


def route_after_step2(state: State) -> str:
    # loop until counter reaches 3
    if state["counter"] < 3:
        return "step2"
    else:
        return "step3"


def step3(state: State) -> State:
    # final step
    return {"result": f"finished at counter={state['counter']}"}


# add nodes
graph.add_node("step1", step1)
graph.add_node("step2", step2)
graph.add_node("step3", step3)

# edges
graph.add_edge(START, "step1")
graph.add_edge("step1", "step2")
graph.add_conditional_edges("step2", route_after_step2)
graph.add_edge("step3", END)


def build():
    # print(graph.compile().get_graph().draw_ascii())
    build_callable_graph(graph)
    # print(graph.compile().invoke({}))


if __name__ == "__main__":
    build()
