import {
    EventBus,
    Event,
    Log
} from "../../Source";

describe("EventBus", () => {
    const mockEmitFn = jest.fn();
    const mockEvent = {} as Event;

    let infoSpy: jest.SpyInstance;

    beforeEach(() => {
        (EventBus as any).emitFunction = null;
        mockEmitFn.mockClear();

        infoSpy = jest.spyOn(Log, "Info").mockImplementation(() => {});
    });

    afterEach(() => {
        infoSpy.mockRestore();
    });

    it("should throw an error if Emit is called before Initialize", () => {
        expect(() => {
            EventBus.Emit(mockEvent);
        }).toThrow(
            "EventBus::Emit - EventBus has not been initialized! " +
            "Did you forget to call 'EventBus.Initialize()'?"
        );
    });

    it("should call the emitFunction after being initialized", () => {
        EventBus.Initialize(mockEmitFn);
        EventBus.Emit(mockEvent);
        
        expect(mockEmitFn).toHaveBeenCalledTimes(1);
        expect(mockEmitFn).toHaveBeenCalledWith(mockEvent);
    });
});
