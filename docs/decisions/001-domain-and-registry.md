# 001 — Domain document and module registry

Flow Canvas stores a small, versioned JSON project. React Flow objects are
derived at the rendering boundary so library-specific state cannot enter an
exported project.

The module registry is assembled explicitly at the client composition root.
Each module supplies a Zod configuration schema, valid defaults, static ports
and explicit inspector field descriptors. Registry construction rejects
duplicate types, duplicate ports and invalid defaults. Definitions and their
defaults are copied and frozen on registration.

Full project validation checks the persisted schema, registered module types,
node configurations, graph endpoints, port compatibility and scenario targets.
Cycles are allowed because a diagram is not an execution engine. A future
module can be registered without modifying the core validator.
