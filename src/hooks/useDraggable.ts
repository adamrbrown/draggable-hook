import { useEffect, useRef, useState } from 'react';

interface Position {
  left: number;
  top: number;
}

interface UseDragDropOptions {
  dragx?: boolean;
  dragy?: boolean;
  disabled?: boolean;
  cadence?: number | Position;
  container?: HTMLElement | null;
  onDragStart?: (event: MouseEvent) => void;
  onDragMove?: (event: MouseEvent) => void;
  onDragEnd?: (event: MouseEvent) => void;
}

function useDraggable({
  dragx = true,
  dragy = true,
  cadence = 1,
  disabled = false,
  container: containerOption,
  onDragStart,
  onDragMove,
  onDragEnd,
}: UseDragDropOptions = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const container = containerOption ?? document.body;

  const [active, setActive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mouseDownPosition, setMouseDownPosition] = useState({
    left: 0,
    top: 0,
  });
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [elementOffset, setElementOffset] = useState({ left: 0, top: 0 });

  const drag = (event: MouseEvent) => {
    event.preventDefault();

    if (!ref.current) return;
    if (disabled) return;

    if (event.type !== 'mousedown') {
      console.warn('Drag can only be initiated by mousedown event');
      return;
    }

    const { x: containerX, y: containerY } = container.getBoundingClientRect();
    const { x: elementX, y: elementY } = ref.current.getBoundingClientRect();

    const elementOffsetLeft = elementX - containerX;
    const elementOffsetTop = elementY - containerY;

    setMouseDownPosition({ left: event.clientX, top: event.clientY });
    setElementOffset({ left: elementOffsetLeft, top: elementOffsetTop });

    setActive(true);

    if (onDragStart) onDragStart(event);
  };

  useEffect(() => {
    if (container === document.body) return;
    container.style.position = 'relative';
  }, [container]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!active) return;

      const cadenceLeft = typeof cadence === 'object' ? cadence.left : cadence;
      const cadenceTop = typeof cadence === 'object' ? cadence.top : cadence;

      const { left: mouseDownX, top: mouseDownY } = mouseDownPosition;

      const nextDragPosition: Position = {
        left: elementOffset.left + Math.round((event.x - mouseDownX) / cadenceLeft) * cadenceLeft,
        top: elementOffset.top + Math.round((event.y - mouseDownY) / cadenceTop) * cadenceTop,
      };

      if (containerOption) {
        if (nextDragPosition.left <= 0) nextDragPosition.left = 0;
        if (nextDragPosition.top <= 0) nextDragPosition.top = 0;

        if (nextDragPosition.left + ref.current!.clientWidth >= container.clientWidth) {
          nextDragPosition.left = container.clientWidth - ref.current!.clientWidth;
        }

        if (nextDragPosition.top + ref.current!.clientHeight >= container.clientHeight) {
          nextDragPosition.top = container.clientHeight - ref.current!.clientHeight;
        }
      }

      const left = dragx ? nextDragPosition.left : elementOffset.left;
      const top = dragy ? nextDragPosition.top : elementOffset.top;

      setPosition({ left, top });
      setDragging(true);

      if (onDragMove) onDragMove(event);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [
    cadence,
    container,
    containerOption,
    dragx,
    dragy,
    active,
    mouseDownPosition,
    elementOffset,
    onDragMove,
  ]);

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if (!active) return;

      event.preventDefault();

      setActive(false);
      setDragging(false);

      if (onDragEnd) onDragEnd(event);
    };

    document.addEventListener('mouseup', handleMouseUp);

    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [active, onDragEnd]);

  return {
    ref,
    active,
    dragging,
    position,
    drag,
  };
}

export { useDraggable, UseDragDropOptions };
