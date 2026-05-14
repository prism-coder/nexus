import {
    LayerStack,
    Layer,
    Event,
    Log,
    EventCategory,
    InvalidArgumentError,
    DuplicateLayerError,
    LayerNotFoundError
} from "../../Source";

class MockLayer extends Layer {
    constructor(public name: string) {
        super();
    }

    OnAttach = jest.fn();
    OnDetach = jest.fn();
    OnUpdate = jest.fn();
    OnEvent = jest.fn();
}

const EventType = {
    None: "None"
}

class MockEvent extends Event {
    Name = "MockEvent";
    Category = EventCategory.None;
    Type = EventType.None;
}

jest.spyOn(Log, "Info").mockImplementation(() => {});

describe("LayerStack", () => {
    let layerStack: LayerStack;
    let layer1: MockLayer;
    let layer2: MockLayer;
    let overlay: MockLayer;

    beforeEach(() => {
        layerStack = new LayerStack();
        layer1 = new MockLayer("Layer1");
        layer2 = new MockLayer("Layer2");
        overlay = new MockLayer("Overlay");

        layerStack.PushLayer(layer1);
        layerStack.PushLayer(layer2);
        layerStack.PushOverlay(overlay);

        layer1.OnAttach.mockClear();
        layer2.OnAttach.mockClear();
        overlay.OnAttach.mockClear();
    });

    it("should propagate OnUpdate from bottom-to-top (Layer -> Overlay)", () => {
        const updateOrder: string[] = [];
        layer1.OnUpdate.mockImplementation(() => updateOrder.push("layer1"));
        layer2.OnUpdate.mockImplementation(() => updateOrder.push("layer2"));
        overlay.OnUpdate.mockImplementation(() => updateOrder.push("overlay"));

        layerStack.OnUpdate(16);

        expect(updateOrder).toEqual(["layer1", "layer2", "overlay"]);
    });

    it("should propagate OnEvent from top-to-bottom (Overlay -> Layer)", () => {
        const eventOrder: string[] = [];
        const event = new MockEvent();
        layer1.OnEvent.mockImplementation(() => eventOrder.push("layer1"));
        layer2.OnEvent.mockImplementation(() => eventOrder.push("layer2"));
        overlay.OnEvent.mockImplementation(() => eventOrder.push("overlay"));

        layerStack.OnEvent(event);

        expect(eventOrder).toEqual(["overlay", "layer2", "layer1"]);
    });

    it("should stop OnEvent propagation when an event is consumed", () => {
        const event = new MockEvent();
        layer2.OnEvent.mockImplementation(() => {
            event.Consume();
        });

        layerStack.OnEvent(event);

        expect(overlay.OnEvent).toHaveBeenCalledTimes(1);
        expect(layer2.OnEvent).toHaveBeenCalledTimes(1);
        expect(layer1.OnEvent).not.toHaveBeenCalled();
    });

    it("should pop a layer and call OnDetach", () => {
        expect(layerStack.GetLayers()).toHaveLength(3);

        layerStack.PopLayer(layer2);

        expect(layerStack.GetLayers()).toHaveLength(2);
        expect(layerStack.GetLayers()).toEqual([layer1, overlay]);
        expect(layer2.OnDetach).toHaveBeenCalledTimes(1);
        expect(layer1.OnDetach).not.toHaveBeenCalled();
    });

    it("should throw LayerNotFoundError when trying to pop an overlay using PopLayer", () => {
        expect(() => layerStack.PopLayer(overlay)).toThrow(LayerNotFoundError);
        expect(layerStack.GetLayers()).toHaveLength(3);
        expect(overlay.OnDetach).not.toHaveBeenCalled();
    });

    it("should pop an overlay and call OnDetach", () => {
        expect(layerStack.GetLayers()).toHaveLength(3);

        layerStack.PopOverlay(overlay);

        expect(layerStack.GetLayers()).toHaveLength(2);
        expect(layerStack.GetLayers()).toEqual([layer1, layer2]);
        expect(overlay.OnDetach).toHaveBeenCalledTimes(1);
    });

    it("should throw LayerNotFoundError when trying to pop a layer using PopOverlay", () => {
        expect(() => layerStack.PopOverlay(layer1)).toThrow(LayerNotFoundError);
        expect(layerStack.GetLayers()).toHaveLength(3);
        expect(layer1.OnDetach).not.toHaveBeenCalled();
    });

    it("should call OnDetach on all layers during Shutdown", () => {
        layerStack.Shutdown();

        expect(layer1.OnDetach).toHaveBeenCalledTimes(1);
        expect(layer2.OnDetach).toHaveBeenCalledTimes(1);
        expect(overlay.OnDetach).toHaveBeenCalledTimes(1);
        expect(layerStack.GetLayers()).toHaveLength(0);
    });

    it("should throw InvalidArgumentError when PushLayer receives null", () => {
        expect(() => {
            layerStack.PushLayer(null as unknown as Layer);
        }).toThrow(InvalidArgumentError);
    });

    it("should throw InvalidArgumentError when PushOverlay receives null", () => {
        expect(() => {
            layerStack.PushOverlay(null as unknown as Layer);
        }).toThrow(InvalidArgumentError);
    });

    it("should throw InvalidArgumentError when PopLayer receives null", () => {
        expect(() => {
            layerStack.PopLayer(null as unknown as Layer);
        }).toThrow(InvalidArgumentError);
    });

    it("should throw InvalidArgumentError when PopOverlay receives null", () => {
        expect(() => {
            layerStack.PopOverlay(null as unknown as Layer);
        }).toThrow(InvalidArgumentError);
    });

    it("should throw DuplicateLayerError when pushing a layer already in the stack", () => {
        expect(() => {
            layerStack.PushLayer(layer1);
        }).toThrow(DuplicateLayerError);
    });

    it("should throw DuplicateLayerError when pushing an overlay already in the stack", () => {
        expect(() => {
            layerStack.PushOverlay(overlay);
        }).toThrow(DuplicateLayerError);
    });

    it("should throw LayerNotFoundError when PopLayer is called with a layer not in the stack", () => {
        const unknownLayer = new MockLayer("unknown");
        expect(() => layerStack.PopLayer(unknownLayer)).toThrow(LayerNotFoundError);
        expect(layerStack.GetLayers()).toHaveLength(3);
    });

    it("should throw LayerNotFoundError when PopOverlay is called with an overlay not in the stack", () => {
        const unknownOverlay = new MockLayer("unknown");
        expect(() => layerStack.PopOverlay(unknownOverlay)).toThrow(LayerNotFoundError);
        expect(layerStack.GetLayers()).toHaveLength(3);
    });

    it("should continue OnUpdate for all layers even if one throws", () => {
        const errorSpy = jest.spyOn(Log, "Error").mockImplementation(() => {});
        layer1.OnUpdate.mockImplementation(() => { throw new Error("layer1 update error"); });

        layerStack.OnUpdate(16);

        expect(layer1.OnUpdate).toHaveBeenCalledTimes(1);
        expect(layer2.OnUpdate).toHaveBeenCalledTimes(1);
        expect(overlay.OnUpdate).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("layer1 update error")
        );

        errorSpy.mockRestore();
    });

    it("should continue OnEvent propagation for remaining layers even if one throws", () => {
        const errorSpy = jest.spyOn(Log, "Error").mockImplementation(() => {});
        const event = new MockEvent();
        overlay.OnEvent.mockImplementation(() => { throw new Error("overlay event error"); });

        layerStack.OnEvent(event);

        expect(overlay.OnEvent).toHaveBeenCalledTimes(1);
        expect(layer2.OnEvent).toHaveBeenCalledTimes(1);
        expect(layer1.OnEvent).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("overlay event error")
        );

        errorSpy.mockRestore();
    });
});
