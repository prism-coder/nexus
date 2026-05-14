import {
    ServiceLocator,
    ServiceContainer,
    Service,
    Log,
    InvalidArgumentError,
    NotInitializedError,
    AlreadyInitializedError,
    ServiceNotFoundError
} from "../../Source";

class MockService extends Service {
    OnInitialize = jest.fn(async () => {});
    OnShutdown = jest.fn(async () => {});
    DoWork = () => "work_done";
}

class UnregisteredService extends Service {
    OnInitialize = jest.fn(async () => {});
    OnShutdown = jest.fn(async () => {});
}

jest.spyOn(Log, "Info").mockImplementation(() => {});
jest.spyOn(Log, "Warning").mockImplementation(() => {});

describe("ServiceLocator", () => {
    let container: ServiceContainer;
    let service: MockService;

    beforeEach(() => {
        (ServiceLocator as any).container = null;

        container = new ServiceContainer();
        service = new MockService();

        container.Register(MockService, service);
    });

    it("should throw InvalidArgumentError if Initialize is called with null", () => {
        expect(() => {
            ServiceLocator.Initialize(null as unknown as ServiceContainer);
        }).toThrow(InvalidArgumentError);
    });

    it("should throw AlreadyInitializedError if Initialize is called more than once", () => {
        ServiceLocator.Initialize(container);

        expect(() => {
            ServiceLocator.Initialize(container);
        }).toThrow(AlreadyInitializedError);
    });

    it("should throw NotInitializedError if Get is called before ServiceLocator is initialized", () => {
        expect(() => {
            ServiceLocator.Get(MockService);
        }).toThrow(NotInitializedError);
    });

    it("should throw ServiceNotFoundError if Get is called for an unregistered service", () => {
        ServiceLocator.Initialize(container);

        expect(() => {
            ServiceLocator.Get(UnregisteredService);
        }).toThrow(ServiceNotFoundError);
    });

    it("should throw NotInitializedError if Get is called before Service is initialized", async () => {
        ServiceLocator.Initialize(container);

        expect(() => {
            ServiceLocator.Get(MockService);
        }).toThrow(NotInitializedError);
    });

    it("should Get a service after *both* Locator and Service are initialized", async () => {
        await container.Initialize();

        ServiceLocator.Initialize(container);

        const retrieved = ServiceLocator.Get(MockService);
        expect(retrieved).toBe(service);
        expect(retrieved.DoWork()).toBe("work_done");
    });
});
