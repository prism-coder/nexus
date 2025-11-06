import {
    LayerStack,
    Layer,
    Event,
    Log,
    EventCategory
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
        layer1 = new MockLayer("layer1");
        layer2 = new MockLayer("layer2");
        overlay = new MockLayer("overlay");

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

    it("should not pop an overlay using PopLayer", () => {
        layerStack.PopLayer(overlay);

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

    it("should not pop a layer using PopOverlay", () => {
        layerStack.PopOverlay(layer1);

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
});
