from langgraph.graph.state import CompiledStateGraph
from graph_helper import LangGraphCtxHelper
from graph import CallableGraph


def build_callable_graph(compiled_graph: CompiledStateGraph) -> None:
    helper = LangGraphCtxHelper(compiled_graph)
    graph = CallableGraph(helper)
    print(graph.run_all_nodes())
    # print((helper.lc_graph.nodes["step1"].data).name)
    # print(helper.ex_tool("step2", {}))
    # print(f"{graph.to_dict()}\n\n")
    # print(graph.nodes)
    # print(graph.edges)
