from typing import Annotated
from typing_extensions import TypedDict
from operator import add

from langgraph.graph import StateGraph, START, END
from lantern import build_callable_graph


def dict_merge(lhs: dict, rhs: dict) -> dict:
    return {**lhs, **rhs}


class State(TypedDict, total=False):
    foo: str
    baz: str
    num: int
    counter: int
    loop_done: bool
    summary: str
    final: str

    logs: Annotated[list[str], add]
    data: Annotated[dict, dict_merge]


graph = StateGraph(State)


def step1(state: State) -> State:
    return {
        "foo": "bar",
        "counter": 1,
        "loop_done": False,
        "logs": ["init"],
        "data": {"seed": 42},
    }


def step2(state: State) -> State:
    baz = state["foo"].upper()
    return {
        "baz": baz,
        "logs": [f"baz={baz}"],
        "data": {"branch": "A"},
    }


def step3(state: State) -> State:
    num = (state.get("counter") or 0) * 2
    return {
        "num": num,
        "logs": [f"num={num}"],
        "data": {"branch": "B"},
    }


def step4(state: State) -> State:
    new_counter = (state.get("counter") or 0) + 1
    return {
        "counter": new_counter,
        "logs": [f"counter={new_counter}"],
        "data": {"last_loop": new_counter},
    }


def route_after_step4(state: State) -> str:
    if (state.get("counter") or 0) < 3:
        return "step4"
    else:
        return "step5"


def step5(state: State) -> State:
    baz = state.get("baz", "")
    num = state.get("num", 0)
    summary = f"{baz}:{num}"
    return {
        "summary": summary,
        "logs": [f"summary={summary}"],
        "data": {"summary_len": len(summary)},
    }


def step6(state: State) -> State:
    final = f"done with {state['summary']}"
    return {
        "final": final,
        "logs": [final],
        "data": {"status": "ok"},
    }


graph.add_node("step1", step1)
graph.add_node("step2", step2)
graph.add_node("step3", step3)
graph.add_node("step4", step4)
graph.add_node("step5", step5)
graph.add_node("step6", step6)


graph.add_edge(START, "step1")
graph.add_edge("step1", "step2")
graph.add_edge("step1", "step3")
graph.add_edge("step1", "step4")


graph.add_conditional_edges(
    "step4", route_after_step4, {"step4": "step4", "step5": "step5"}
)


graph.add_edge("step2", "step5")
graph.add_edge("step3", "step5")


graph.add_edge("step5", "step6")
graph.add_edge("step6", END)


def build():
    build_callable_graph(graph)
    print("\nvs\n")
    print(graph.compile().invoke({}))


if __name__ == "__main__":
    build()
