import os
import sys
import inspect
import importlib.util
from langgraph.graph.state import CompiledStateGraph

from models.graph import Graph
from models.node import Node
from models.edge import Edge


def get_graph(compiled_graph: CompiledStateGraph):
    """ """
    stack = inspect.stack()
    ctx = next(ctx for ctx in stack if ctx.filename != __file__)
    fp = ctx.filename
    print(fp)

    mod_name = os.path.basename(fp).removesuffix(".py")

    spec = importlib.util.spec_from_file_location(mod_name, fp)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[mod_name] = mod
    spec.loader.exec_module(mod)

    graph = compiled_graph.get_graph()
    graph = Graph(nodes=graph.nodes, edges=graph.edges)
    
    print(graph.to_dict())
    return graph