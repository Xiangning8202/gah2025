import os
import sys
import inspect
import importlib.util
from langchain_core.runnables.graph import Graph as LangChainGraph
from types import ModuleType
from langgraph.graph import StateGraph
from typing import List


class LangGraphCtxHelper:
    def __init__(self, graph: StateGraph):
        self.filepath: str = None  # fully resolved filepath
        self.module_name: str = None  # module name (ie; filename w/o extension)
        self.module: ModuleType = None  # module
        self.raw_graph: StateGraph = graph  # langgraph StateGraph (uncompiled)
        self.lc_graph: LangChainGraph = None  # compiled LC graph for nodes/edges
        self.branches: List[tuple[str, str]] = []

        self.load_module()
        self.extract_graph_and_branches()

    def get_filepath(self) -> None:
        """Inspect call stack for full path of call location."""
        stack = inspect.stack()
        # deepest frame is the last one
        ctx = stack[-1]
        self.filepath = ctx.filename
        self.module_name = os.path.basename(self.filepath).removesuffix(".py")

    def load_module(self) -> None:
        """Load module to allow introspection and function calling."""
        if not self.filepath or not self.module_name:
            self.get_filepath()
        spec = importlib.util.spec_from_file_location(self.module_name, self.filepath)
        mod = importlib.util.module_from_spec(spec)
        sys.modules[self.module_name] = mod
        spec.loader.exec_module(mod)
        self.module = mod

    def extract_graph_and_branches(self) -> None:
        """Call LangGraph get_graph method and reformat branches."""
        compiled = self.raw_graph.compile()
        self.lc_graph = compiled.get_graph()
        print(f"lc_graph edges: {self.lc_graph.edges}")
        for node_id, router_map in self.raw_graph.branches.items():
            for func_name in router_map.keys():
                self.branches.append((node_id, func_name))

        print(self.lc_graph.draw_ascii())

    def ex_tool(self, fun: str) -> callable:
        """Return a callable from helper.module by name."""
        target = self.module
        for part in fun.split("."):
            target = getattr(target, part, None)
            if target is None:
                raise AttributeError(f"{fun} not found in {self.module.__name__}")
        if not callable(target):
            raise TypeError(f"{fun} is not callable")
        return target
