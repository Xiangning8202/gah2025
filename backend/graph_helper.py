import os
import sys
import inspect
import importlib.util
from langgraph.graph.state import CompiledStateGraph
from langchain_core.runnables.graph import Graph
from types import ModuleType


class CallableGraphHelper:
    def __init__(self):
        self.filepath: str = None  # fully resolved filepath
        self.module_name: str = None  # module name (ie; filename w/o extension)
        self.graph: Graph = None  # langgraph graph
        self.module: ModuleType = None  # module

        self.load_module()

    def get_filepath(self) -> None:
        """Inspect call stack for full path of call location."""
        stack = inspect.stack()
        ctx = next(ctx for ctx in stack if ctx.filename != __file__)
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

    def extract_graph(self, compiled_graph: CompiledStateGraph) -> Graph:
        """Call LangGraph get_graph method."""
        self.graph = compiled_graph.get_graph()
        return self.graph

    @classmethod
    def get_graph(cls, compiled_graph: CompiledStateGraph) -> "CallableGraphHelper":
        helper = cls()
        helper.extract_graph(compiled_graph)
        return helper
