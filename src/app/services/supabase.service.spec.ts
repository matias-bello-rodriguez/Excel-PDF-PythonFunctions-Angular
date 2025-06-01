import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupabaseService]
    });
    service = TestBed.inject(SupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a user$ observable', () => {
    expect(service.user$).toBeTruthy();
  });

  it('should return null for getCurrentUser initially', () => {
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should return false for isAuthenticated initially', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  // Tests de CRUD
  describe('CRUD Operations', () => {
    it('should get all items from a table', async () => {
      const items = await service.getAll('test_table');
      expect(Array.isArray(items)).toBeTrue();
    });

    it('should get item by id from a table', async () => {
      const item = await service.getById('test_table', '1');
      expect(item).toBeDefined();
    });

    it('should create item in a table', async () => {
      const newItem = { name: 'Test' };
      const created = await service.create('test_table', newItem);
      expect(created).toBeDefined();
    });

    it('should update item in a table', async () => {
      const updateData = { name: 'Updated Test' };
      const updated = await service.update('test_table', '1', updateData);
      expect(updated).toBeDefined();
    });

    it('should delete item from a table', async () => {
      await expectAsync(service.delete('test_table', '1')).toBeResolved();
    });
  });

  // Tests de autenticación
  describe('Authentication', () => {
    it('should sign in user with email and password', (done) => {
      service.signIn('test@example.com', 'password').subscribe({
        next: (response) => {
          expect(response).toBeDefined();
          expect(service.isAuthenticated()).toBeTrue();
          done();
        },
        error: done.fail
      });
    });

    it('should sign out user', (done) => {
      service.signOut().subscribe({
        next: () => {
          expect(service.isAuthenticated()).toBeFalse();
          done();
        },
        error: done.fail
      });
    });
  });

  // Tests de almacenamiento
  describe('Storage', () => {
    it('should upload file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const url = await service.uploadFile('test_bucket', 'test.txt', file);
      expect(url).toContain('storage/v1/object/public');
    });

    it('should delete file', async () => {
      await expectAsync(service.deleteFile('test_bucket', 'test.txt')).toBeResolved();
    });
  });

  // Tests de suscripciones en tiempo real
  describe('Real-time subscriptions', () => {
    it('should subscribe to changes', () => {
      const callback = jasmine.createSpy('callback');
      const subscription = service.subscribeToChanges('test_table', callback);
      expect(subscription).toBeDefined();
    });
  });
});
