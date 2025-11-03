import { Event, EventCategory, EventType } from "../../Source";

class MockInputEvent extends Event {
    Name = "MockInput";
    // Un evento puede estar en múltiples categorías
    Category = EventCategory.Input | EventCategory.Mouse;
    Type = EventType.MouseMoved;
}

describe("Event", () => {
    let event: MockInputEvent;

    beforeEach(() => {
        event = new MockInputEvent();
    });

    it("should correctly check category with bitwise logic", () => {
        // Assert
        expect(event.IsInCategory(EventCategory.Input)).toBe(true);
        expect(event.IsInCategory(EventCategory.Mouse)).toBe(true);

        // Test combinado
        expect(
            event.IsInCategory(EventCategory.Input | EventCategory.Keyboard)
        ).toBe(true);

        // Test de una categoría que no tiene
        expect(event.IsInCategory(EventCategory.Application)).toBe(false);
        expect(event.IsInCategory(EventCategory.Keyboard)).toBe(false);
    });
});
