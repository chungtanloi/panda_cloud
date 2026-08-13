import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DealDetailPanel } from './DealDetailPanel';
import { DEAL_STAGES, MOCK_DEAL_CARD } from './mockData';

describe('DealDetailPanel', () => {
  it('renders header, tags, stages, and sections from the card', () => {
    render(
      <DealDetailPanel card={MOCK_DEAL_CARD} stages={DEAL_STAGES} onClose={vi.fn()} onStageChange={vi.fn()} />,
    );

    expect(screen.getByText('CoreWeave Partnership')).toBeInTheDocument();
    expect(screen.getByText('CoreWeave Inc. — Hyperscaler')).toBeInTheDocument();
    expect(screen.getByText('Hyperscale')).toBeInTheDocument();
    expect(screen.getByText('New Lead')).toBeInTheDocument();
    expect(screen.getByText('Negotiation')).toBeInTheDocument();
    expect(screen.getByText('NDA Signed')).toBeInTheDocument();
    expect(screen.getByText('0 of 4 items complete')).toBeInTheDocument();
    expect(screen.getByText('John McCarthy')).toBeInTheDocument();
  });

  it('calls onStageChange with the clicked stage id', () => {
    const onStageChange = vi.fn();
    render(
      <DealDetailPanel card={MOCK_DEAL_CARD} stages={DEAL_STAGES} onClose={vi.fn()} onStageChange={onStageChange} />,
    );

    fireEvent.click(screen.getByText('Evaluation'));
    expect(onStageChange).toHaveBeenCalledWith('evaluation');
  });

  it('calls onToggleDueDiligence with the clicked item id', () => {
    const onToggleDueDiligence = vi.fn();
    render(
      <DealDetailPanel
        card={MOCK_DEAL_CARD}
        stages={DEAL_STAGES}
        onClose={vi.fn()}
        onStageChange={vi.fn()}
        onToggleDueDiligence={onToggleDueDiligence}
      />,
    );

    fireEvent.click(screen.getByText('NDA Signed'));
    expect(onToggleDueDiligence).toHaveBeenCalledWith('nda');
  });

  it('advances to the next stage by default when Advance is clicked', () => {
    const onStageChange = vi.fn();
    render(
      <DealDetailPanel card={MOCK_DEAL_CARD} stages={DEAL_STAGES} onClose={vi.fn()} onStageChange={onStageChange} />,
    );

    fireEvent.click(screen.getByText('Advance'));
    // MOCK_DEAL_CARD sits in 'new_lead' (order 0); the next stage is 'qualified'.
    expect(onStageChange).toHaveBeenCalledWith('qualified');
  });

  it('uses a custom onAdvance instead of the default next-stage behavior when provided', () => {
    const onStageChange = vi.fn();
    const onAdvance = vi.fn();
    render(
      <DealDetailPanel
        card={MOCK_DEAL_CARD}
        stages={DEAL_STAGES}
        onClose={vi.fn()}
        onStageChange={onStageChange}
        onAdvance={onAdvance}
      />,
    );

    fireEvent.click(screen.getByText('Advance'));
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(onStageChange).not.toHaveBeenCalled();
  });

  it('patches projectNotes via onChange as the textarea is edited', () => {
    const onChange = vi.fn();
    render(
      <DealDetailPanel card={MOCK_DEAL_CARD} stages={DEAL_STAGES} onClose={vi.fn()} onStageChange={vi.fn()} onChange={onChange} />,
    );

    const textarea = screen.getByPlaceholderText('Add notes about this deal…');
    fireEvent.change(textarea, { target: { value: 'Updated notes' } });
    expect(onChange).toHaveBeenCalledWith({ projectNotes: 'Updated notes' });
  });

  it('calls onClose when the backdrop is clicked but not when the panel itself is clicked', () => {
    const onClose = vi.fn();
    render(<DealDetailPanel card={MOCK_DEAL_CARD} stages={DEAL_STAGES} onClose={onClose} onStageChange={vi.fn()} />);

    fireEvent.click(screen.getByText('CoreWeave Partnership'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables stage buttons and footer actions when readOnly', () => {
    render(<DealDetailPanel card={MOCK_DEAL_CARD} stages={DEAL_STAGES} onClose={vi.fn()} onStageChange={vi.fn()} readOnly />);

    expect(screen.getByText('Qualified').closest('button')).toBeDisabled();
    expect(screen.getByText('Save changes').closest('button')).toBeDisabled();
    expect(screen.getByText('Advance').closest('button')).toBeDisabled();
  });

  it('wires Call/Email/Text buttons to the contact when handlers are provided', () => {
    const onCall = vi.fn();
    const onEmail = vi.fn();
    const onText = vi.fn();
    render(
      <DealDetailPanel
        card={MOCK_DEAL_CARD}
        stages={DEAL_STAGES}
        onClose={vi.fn()}
        onStageChange={vi.fn()}
        onCall={onCall}
        onEmail={onEmail}
        onText={onText}
      />,
    );

    fireEvent.click(screen.getByText('Call'));
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByText('Text'));

    expect(onCall).toHaveBeenCalledWith(MOCK_DEAL_CARD.primaryContact);
    expect(onEmail).toHaveBeenCalledWith(MOCK_DEAL_CARD.primaryContact);
    expect(onText).toHaveBeenCalledWith(MOCK_DEAL_CARD.primaryContact);
  });
});
