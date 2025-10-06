import { createElement, Fragment } from "react";

/**
 * Renders Drupal Canvas Code Components from raw component tree data.
 * @param {Object} props - Component props
 * @param {Array} props.componentTree - Raw component tree data.
 * @param {Object} props.components - Component map to render the components.
 */
export function Renderer({ data, componentMap }) {
  const { rootComponents, nodeMap, childrenMap } = indexComponents(data);
  return (
    <Fragment client:load>
      {rootComponents.map((component) =>
        renderComponent(component, nodeMap, childrenMap, componentMap),
      )}
    </Fragment>
  );
}

/*
 * Indexes the components in the data.
 * @param {Array} data - Raw component tree data.
 * @returns {Object} - Indexed components.
 */
function indexComponents(data) {
  const nodeMap = new Map();
  const rootComponents = [];
  const childrenMap = new Map();

  data.forEach((component) => {
    nodeMap.set(component.uuid, component);

    if (component.parent_uuid === null) {
      rootComponents.push(component);
    } else {
      if (!childrenMap.has(component.parent_uuid)) {
        childrenMap.set(component.parent_uuid, []);
      }
      childrenMap.get(component.parent_uuid).push(component);
    }
  });

  return { rootComponents, nodeMap, childrenMap };
}

/*
 * Renders a component recursively with its children.
 * @param {Object} component - The component to render.
 * @param {Map} nodeMap - The indexed map of components.
 * @param {Map} childrenMap - The indexed map of children components.
 * @param {Object} componentMap - The map of components to render.
 * @returns {React.ReactNode} - The rendered component.
 */
function renderComponent(component, nodeMap, childrenMap, componentMap) {
  const ComponentType = componentMap[component.component_id];

  if (!ComponentType) {
    throw new Error(`Component type ${component.component_id} not found`);
  }

  const inputs = parseInputs(component.inputs);
  const children = childrenMap.get(component.uuid) || [];

  // Group children by slot.
  const slotChildren = {};
  children.forEach((child) => {
    const slot = child.slot || "default";
    if (!slotChildren[slot]) {
      slotChildren[slot] = [];
    }
    slotChildren[slot].push(
      renderComponent(child, nodeMap, childrenMap, componentMap),
    );
  });

  // Create props object with inputs and slot content.
  const props = {
    ...inputs,
    ...Object.fromEntries(
      Object.entries(slotChildren).map(([slot, children]) => [
        slot,
        children.length === 1 ? children[0] : children,
      ]),
    ),
  };

  return createElement(ComponentType, {
    key: component.uuid,
    ...props,
  });
}

function normalizeInputValue(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If it's not an object, return as is.
  if (typeof obj !== "object") {
    return obj;
  }

  // If it's an array, normalize each item.
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeInputValue(item));
  }

  // If object has a 'value' key, extract it.
  // This handles structures like { value: "text" } or { value: { src: "..." } }
  if ("value" in obj && Object.keys(obj).length > 1 && "sourceType" in obj) {
    // For complex structures with sourceType, extract the value.
    return normalizeInputValue(obj.value);
  } else if ("value" in obj && typeof obj.value === "string") {
    // For simple text values, return just the value.
    return obj.value;
  }

  // Otherwise, recursively normalize all properties.
  const normalized = {};
  for (const [key, value] of Object.entries(obj)) {
    normalized[key] = normalizeInputValue(value);
  }
  return normalized;
}

function parseInputs(inputs) {
  try {
    const parsed = JSON.parse(inputs);
    return normalizeInputValue(parsed);
  } catch (error) {
    console.error("Failed to parse inputs:", inputs, error);
    return {};
  }
}
