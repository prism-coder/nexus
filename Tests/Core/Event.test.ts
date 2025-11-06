import {
    Event,
    EventCategory
} from "../../Source";

class MockEvent extends Event {
    Name = "Mock";
    Category = EventCategory.Database | EventCategory.Network;
    Type = "Mock:Test";
}

describe("Event", () => {
    let event: MockEvent;

    beforeEach(() => {
        event = new MockEvent();
    });

    it("should correctly check category with bitwise logic", () => {
        expect(event.IsInCategory(EventCategory.Database)).toBe(true);
        expect(event.IsInCategory(EventCategory.Network)).toBe(true);
        expect(event.IsInCategory(EventCategory.Database | EventCategory.Network)).toBe(true);
        expect(event.IsInCategory(EventCategory.Application)).toBe(false);
        expect(event.IsInCategory(EventCategory.User)).toBe(false);
    });
});
