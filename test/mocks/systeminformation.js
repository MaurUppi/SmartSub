/**
 * Mock for systeminformation module in tests
 */

const mockSystemInformation = {
  graphics: jest.fn().mockResolvedValue({
    controllers: [
      {
        vendor: 'Intel Corporation',
        model: 'Intel Arc A770 16GB',
        bus: 'PCI',
        vram: 16384,
        driverVersion: '31.0.101.5590',
      },
    ],
  }),
  system: jest.fn().mockResolvedValue({
    manufacturer: 'Intel',
    model: 'Core Ultra 7 155H',
  }),
  cpu: jest.fn().mockResolvedValue({
    manufacturer: 'GenuineIntel',
    brand: 'Intel(R) Core(TM) Ultra 7 155H @ 3.80GHz',
  }),
};

module.exports = mockSystemInformation;
