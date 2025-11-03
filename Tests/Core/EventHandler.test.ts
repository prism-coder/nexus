import { Event, EventType, EventCategory, EventHandler } from "../../Source";

// --- Clases de Evento Falsas (Mocks) ---
// Necesitamos eventos concretos para testear
class TestEventA extends Event {
    Name = "TestA";
    Category = EventCategory.Test;
    Type = EventType.Test;
}

class TestEventB extends Event {
    Name = "TestB";
    Category = EventCategory.Application;
    Type = EventType.UserRegistered;
}
// ---

// describe agrupa tests relacionados
describe("EventHandler", () => {
    let eventA: TestEventA;
    let eventB: TestEventB;

    // beforeEach se ejecuta antes de cada 'it' (test)
    beforeEach(() => {
        eventA = new TestEventA();
        eventB = new TestEventB();
    });

    // 'it' es el test individual
    it("should call the handler for the correct event type", () => {
        // Arrange (Preparar)
        const handler = new EventHandler(eventA);
        // jest.fn() crea una función "espía"
        const mockCallback = jest.fn(() => false);

        // Act (Actuar)
        handler.Handle(EventType.Test, mockCallback);

        // Assert (Verificar)
        // Verificamos que el callback fue llamado exactamente 1 vez
        expect(mockCallback).toHaveBeenCalledTimes(1);
        // Verificamos que fue llamado con el evento correcto
        expect(mockCallback).toHaveBeenCalledWith(eventA);
    });

    it("should NOT call the handler for the wrong event type", () => {
        // Arrange
        const handler = new EventHandler(eventA); // Evento es Tipo Test
        const mockCallback = jest.fn(() => false);

        // Act
        // Intentamos manejarlo con un tipo diferente
        handler.Handle(EventType.UserRegistered, mockCallback);

        // Assert
        // Verificamos que el callback NUNCA fue llamado
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should consume the event if the handler returns true", () => {
        // Arrange
        const handler = new EventHandler(eventA);
        // El callback ahora devuelve 'true'
        const mockCallback = jest.fn(() => true);

        // Act
        handler.Handle(EventType.Test, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledTimes(1);
        // Verificamos que el evento fue consumido
        expect(eventA.Consumed()).toBe(true);
    });

    it("should NOT consume the event if the handler returns false", () => {
        // Arrange
        const handler = new EventHandler(eventA);
        const mockCallback = jest.fn(() => false);

        // Act
        handler.Handle(EventType.Test, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledTimes(1);
        // Verificamos que el evento NO fue consumido
        expect(eventA.Consumed()).toBe(false);
    });

    it("should not call the handler if the event is already consumed", () => {
        // Arrange
        eventA.Consume(); // Consumimos el evento de antemano
        const handler = new EventHandler(eventA);
        const mockCallback = jest.fn(() => false);

        // Act
        handler.Handle(EventType.Test, mockCallback);

        // Assert
        expect(mockCallback).not.toHaveBeenCalled();
    });
});
