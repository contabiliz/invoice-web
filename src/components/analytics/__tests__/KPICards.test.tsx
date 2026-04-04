import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICards } from '../KPICards';

describe('KPICards', () => {
  const mockData = {
    total: 1250,
    successRate: 98.5,
    failures: 18,
  };

  // T-ANALYTICS-01
  it('renders skeleton when loading', () => {
    render(<KPICards data={null} isLoading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // T-ANALYTICS-02
  it('displays total documents formatted with locale', () => {
    render(<KPICards data={mockData} isLoading={false} />);
    expect(screen.getByText('Total de documentos')).toBeTruthy();
    expect(screen.getByText('1.250')).toBeTruthy();
  });

  // T-ANALYTICS-03
  it('displays success rate as percentage', () => {
    render(<KPICards data={mockData} isLoading={false} />);
    expect(screen.getByText('Taxa de sucesso')).toBeTruthy();
    expect(screen.getByText('98.5%')).toBeTruthy();
  });

  // T-ANALYTICS-04
  it('displays failure count', () => {
    render(<KPICards data={mockData} isLoading={false} />);
    expect(screen.getByText('Falhas')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
  });

  // T-ANALYTICS-05
  it('shows zeros when data is null and not loading', () => {
    render(<KPICards data={null} isLoading={false} />);
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('0.0%')).toBeTruthy();
  });

  // T-ANALYTICS-06
  it('uses Geist Mono font for numeric values', () => {
    render(<KPICards data={mockData} isLoading={false} />);
    const values = document.querySelectorAll('font-mono');
    expect(values.length).toBeGreaterThanOrEqual(3);
  });
});
