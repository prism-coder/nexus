import { Service } from "../../Source/Core/Service";

class TestService extends Service {
    OnInitialize = jest.fn(async () => {});
    OnShutdown = jest.fn(async () => {});
}

describe("Service", () => {
    let service: TestService;

    beforeEach(() => {
        service = new TestService();
    });

    it("should be uninitialized by default", () => {
        expect(service.IsInitialized()).toBe(false);
    });

    it("should set Initialized flag to true after Initialize", async () => {
        await service.Initialize();

        expect(service.OnInitialize).toHaveBeenCalledTimes(1);
        expect(service.IsInitialized()).toBe(true);
    });

    it("should set Initialized flag to false after Shutdown", async () => {
        await service.Initialize();
        expect(service.IsInitialized()).toBe(true);

        await service.Shutdown();

        expect(service.OnShutdown).toHaveBeenCalledTimes(1);
        expect(service.IsInitialized()).toBe(false);
    });
});
