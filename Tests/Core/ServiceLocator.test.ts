import {
    ServiceLocator,
    ServiceContainer,
    Service,
    Log
} from "../../Source";

class MockService extends Service {
    OnInitialize = jest.fn(async () => {});
    OnShutdown = jest.fn(async () => {});
    DoWork = () => "work_done";
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

    it("should throw an error if Get is called before Locator is initialized", () => {
        expect(() => {
            ServiceLocator.Get(MockService);
        }).toThrow(
            "ServiceLocator::Get - ServiceLocator has not been initialized! " +
            "Did you forget to call 'ServiceLocator.Initialize()'?"
        );
    });

    it("should throw an error if Get is called before Service is initialized", async () => {
        ServiceLocator.Initialize(container);

        expect(() => {
            ServiceLocator.Get(MockService);
        }).toThrow(
            `ServiceLocator::Get - An attempt was made to retrieve the service 'MockService' before it was initialized.`
        );
    });

    it("should Get a service after *both* Locator and Service are initialized", async () => {
        await container.Initialize();

        ServiceLocator.Initialize(container);

        const retrieved = ServiceLocator.Get(MockService);
        expect(retrieved).toBe(service);
        expect(retrieved.DoWork()).toBe("work_done");
    });

    it("should log a warning if initialized more than once", () => {
        const container2 = new ServiceContainer();
        
        ServiceLocator.Initialize(container);

        expect(() => {
            ServiceLocator.Initialize(container2);
        }).toThrow(
            "ServiceLocator::Initialize - ServiceLocator has already been initialized! " +
            "Did you call 'ServiceLocator.Initialize()' more than once?"
        );
    });
});
