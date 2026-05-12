import {
    Event,
    EventCategory,
    EventHandler,
    Log
} from "../../Source";

const EventType = {
    Test: {
        A: "Test:A",
        B: "Test:B",
    }
}

class TestEventA extends Event {
    Name = "TestA";
    Category = EventCategory.Custom;
    Type = EventType.Test.A;
}

class TestEventB extends Event {
    Name = "TestB";
    Category = EventCategory.Application;
    Type = EventType.Test.B;
}

describe("EventHandler", () => {
    let eventA: TestEventA;
    let eventB: TestEventB;

    beforeEach(() => {
        eventA = new TestEventA();
        eventB = new TestEventB();
    });

    it("should call the handler for the correct event type", () => {
        const handler = new EventHandler(eventA);
        const mockCallback = jest.fn(() => false);

        handler.Handle(EventType.Test.A, mockCallback);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(eventA);
    });

    it("should NOT call the handler for the wrong event type", () => {
        const handler = new EventHandler(eventA);
        const mockCallback = jest.fn(() => false);

        handler.Handle(EventType.Test.B, mockCallback);

        expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should consume the event if the handler returns true", async () => {
        const handler = new EventHandler(eventA);

        const mockCallback = jest.fn(() => true);

        handler.Handle(EventType.Test.A, mockCallback);

        expect(await mockCallback).toHaveBeenCalledTimes(1);
        expect(eventA.Consumed()).toBe(true);
    });

    it("should NOT consume the event if the handler returns false", async () => {
        const handler = new EventHandler(eventA);
        const mockCallback = jest.fn(() => false);

        handler.Handle(EventType.Test.A, mockCallback);

        expect(await mockCallback).toHaveBeenCalledTimes(1);
        expect(eventA.Consumed()).toBe(false);
    });

    it("should not call the handler if the event is already consumed", () => {
        eventA.Consume();
        
        const handler = new EventHandler(eventA);
        const mockCallback = jest.fn(() => false);

        handler.Handle(EventType.Test.A, mockCallback);

        expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should log the error and re-throw if the handler callback throws", async () => {
        const errorSpy = jest.spyOn(Log, "Error").mockImplementation(() => {});
        const handler = new EventHandler(eventA);
        const handlerError = new Error("handler failure");
        const mockCallback = jest.fn(() => { throw handlerError; });

        await expect(handler.Handle(EventType.Test.A, mockCallback)).rejects.toThrow("handler failure");
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("handler failure")
        );

        errorSpy.mockRestore();
    });
});
