import {
    EventBus,
    Event,
    Log,
    NotInitializedError,
    InvalidArgumentError,
    AlreadyInitializedError
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

    it("should throw NotInitializedError if Emit is called before Initialize", () => {
        expect(() => {
            EventBus.Emit(mockEvent);
        }).toThrow(NotInitializedError);
    });

    it("should throw InvalidArgumentError if Initialize is called with null", () => {
        expect(() => {
            EventBus.Initialize(null as unknown as typeof mockEmitFn);
        }).toThrow(InvalidArgumentError);
    });

    it("should throw AlreadyInitializedError if Initialize is called more than once", () => {
        EventBus.Initialize(mockEmitFn);
        
        expect(() => {
            EventBus.Initialize(mockEmitFn);
        }).toThrow(AlreadyInitializedError);
    });

    it("should call the emitFunction after being initialized", () => {
        EventBus.Initialize(mockEmitFn);
        EventBus.Emit(mockEvent);
        
        expect(mockEmitFn).toHaveBeenCalledTimes(1);
        expect(mockEmitFn).toHaveBeenCalledWith(mockEvent);
    });
});
