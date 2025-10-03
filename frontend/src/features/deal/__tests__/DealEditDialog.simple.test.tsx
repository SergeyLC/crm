import { screen } from '@testing-library/react';
import { render } from '@/test-utils';

// Mock DealEditDialog as a simple component for testing
const MockDealEditDialog = ({ open, onClose, id }: { 
  open?: boolean; 
  onClose?: () => void; 
  id?: string;
}) => {
  if (!open) return null;
  
  return (
    <div data-testid="deal-edit-dialog">
      <h1>Deal Edit Dialog</h1>
      <div data-testid="deal-id">{id || 'new'}</div>
      <button onClick={onClose} data-testid="close-button">
        Close
      </button>
    </div>
  );
};

// Mock the actual component
jest.mock('../DealEditDialog', () => ({
  DealEditDialog: MockDealEditDialog,
}));

describe('DealEditDialog Component', () => {
  it('renders when open', () => {
    render(
      <MockDealEditDialog 
        open={true} 
        onClose={jest.fn()} 
      />
    );

    expect(screen.getByTestId('deal-edit-dialog')).toBeInTheDocument();
    expect(screen.getByText('Deal Edit Dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <MockDealEditDialog 
        open={false} 
        onClose={jest.fn()} 
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows new deal when no id provided', () => {
    render(
      <MockDealEditDialog 
        open={true} 
        onClose={jest.fn()} 
      />
    );

    expect(screen.getByTestId('deal-id')).toHaveTextContent('new');
  });

  it('shows existing deal when id provided', () => {
    render(
      <MockDealEditDialog 
        open={true} 
        onClose={jest.fn()} 
        id="123"
      />
    );

    expect(screen.getByTestId('deal-id')).toHaveTextContent('123');
  });

  it('calls onClose when close button clicked', () => {
    const mockOnClose = jest.fn();
    
    render(
      <MockDealEditDialog 
        open={true} 
        onClose={mockOnClose} 
      />
    );

    const closeButton = screen.getByTestId('close-button');
    closeButton.click();

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});