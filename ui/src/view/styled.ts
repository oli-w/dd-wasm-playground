import styled from 'styled-components';

export const Heading = styled.div`
    font-size: 20px;
    font-weight: bold;
`;

export const Table = styled.table`
    border: solid 1px;
    border-collapse: collapse;
`;
export const Th = styled.th`
    text-align: start;
    border: solid 1px;
`;
export const Td = styled.td`
    border: solid 1px;
`;

type AlignItems = 'start' | 'center' | 'end';
export const Col = styled.div<{ $alignItems?: AlignItems }>`
    display: flex;
    flex-direction: column;
    gap: 10px;
    ${({ $alignItems }) => ($alignItems ? `align-items: ${$alignItems};` : null)};
`;

export const Row = styled.div<{
    $wrap?: boolean;
    $center?: boolean;
    $justifyContent?: 'space-between';
    $alignItems?: AlignItems;
}>`
    display: flex;
    flex-direction: row;
    gap: 10px;
    ${({ $wrap = true }) => ($wrap ? 'flex-wrap: wrap;' : null)};
    ${({ $center = false }) => ($center ? 'align-items: center;' : null)};
    ${({ $justifyContent = null }) => ($justifyContent ? `justify-content: ${$justifyContent};` : null)};
    ${({ $alignItems = null }) => ($alignItems ? `align-items: ${$alignItems};` : null)};
`;

export const Box = styled.div`
    border: solid 1px #ccc;
    padding: 5px;
`;
