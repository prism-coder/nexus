import { EventBus, Event } from "../../Source";

describe("EventBus", () => {
    // Creamos una función espía que simula Application.EmitEvent
    const mockEmitFn = jest.fn();
    const mockEvent = {} as Event;

    beforeEach(() => {
        // Reseteamos el estado del EventBus (quitando la función)
        (EventBus as any).emitFunction = null;
        mockEmitFn.mockClear();
    });

    it("should throw an error if Emit is called before Initialize", () => {
        // Espiamos Log.Error ya que no podemos probar 'throw' en un método
        // que captura su propio error.
        const Log = require("../../Source/Core/Log").Log; // Importamos Log aquí
        const errorSpy = jest.spyOn(Log, "Error").mockImplementation(() => {});

        EventBus.Emit(mockEvent);

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("EventBus has not been initialized")
        );
        errorSpy.mockRestore();
    });

    it("should call the emitFunction after being initialized", () => {
        // Act
        EventBus.Initialize(mockEmitFn);
        EventBus.Emit(mockEvent);

        // Assert
        expect(mockEmitFn).toHaveBeenCalledTimes(1);
        expect(mockEmitFn).toHaveBeenCalledWith(mockEvent);
    });
});
