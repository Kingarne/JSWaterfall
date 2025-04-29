import { Component, createSignal, onMount, onCleanup, JSXElement } from 'solid-js';
import { nanoid } from 'nanoid';

import './ScrollbarArea.scss';

interface IScrollbarAreaProps {
  children?: JSXElement;
}

const ScrollbarArea: Component<IScrollbarAreaProps> = (props) => {
  let viewportRef: HTMLDivElement;
  let scrollTrackRef: HTMLDivElement;
  let scrollThumbRef: HTMLDivElement;
  let observer: ResizeObserver;
  const [thumbHeight, setThumbHeight] = createSignal<number>(20);
  const [isDragging, setIsDragging] = createSignal<boolean>(false);
  const [scrollStartPosition, setScrollStartPosition] = createSignal<number>(0);
  const [initialScrollTop, setInitialScrollTop] = createSignal<number>(0);
  const [viewportID] = createSignal<string>(nanoid());
  const [scrollPosition, setScrollPosition] = createSignal<number>(0);

  function handleWheel(evt: WheelEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    if (viewportRef) {
      viewportRef.scrollBy({
        top: evt.deltaY,
        behavior: 'smooth',
      });
    }
  }

  function handleResize(ref: HTMLDivElement, trackSize: number) {
    const { clientHeight, scrollHeight } = ref;
    setThumbHeight(Math.max((clientHeight / scrollHeight) * trackSize, 20));
  }

  function handleThumbPosition() {
    if (viewportRef && scrollTrackRef && scrollThumbRef) {
      const { scrollTop: contentTop, scrollHeight: contentHeight } = viewportRef;
      const { clientHeight: trackHeight } = scrollTrackRef;
      const newTop = Math.min(
        (contentTop / contentHeight) * trackHeight,
        trackHeight - thumbHeight(),
      );
      const newScrollPosition =
        (scrollThumbRef.offsetTop / Math.floor(trackHeight - thumbHeight())) * 100;
      setScrollPosition(newScrollPosition);
      scrollThumbRef.style.top = `${newTop}px`;
    }
  }

  function handleTrackClick(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    if (scrollTrackRef && viewportRef) {
      const { clientY } = evt;
      const target = evt.target as HTMLDivElement;
      const rect = target.getBoundingClientRect();
      const trackTop = rect.top;
      const thumbOffset = -(thumbHeight() / 2);
      const clickRatio = (clientY - trackTop + thumbOffset) / scrollTrackRef.clientHeight;
      const scrollAmount = Math.floor(clickRatio * viewportRef.scrollHeight);
      viewportRef.scrollTo({
        top: scrollAmount,
        behavior: 'smooth',
      });
    }
  }

  function handleThumbPointerDown(evt: PointerEvent) {
    if (evt.pointerType === 'mouse' && evt.button !== 0) {
      return;
    }
    evt.preventDefault();
    evt.stopPropagation();
    setScrollStartPosition(evt.clientY);
    if (viewportRef) {
      setInitialScrollTop(viewportRef.scrollTop);
    }
    setIsDragging(true);
  }

  function handleThumbPointerUpOrLeave(evt: PointerEvent) {
    if (!(evt.pointerType === 'mouse' && evt.button !== 0) || evt.type === 'pointerleave') {
      evt.preventDefault();
      evt.stopPropagation();
      if (isDragging()) {
        setIsDragging(false);
      }
    }
  }

  function handleThumbPointerMove(evt: PointerEvent) {
    if (isDragging() && viewportRef) {
      evt.preventDefault();
      evt.stopPropagation();
      const { scrollHeight: contentScrollHeight, offsetHeight: contentOffsetHeight } = viewportRef;
      const deltaY = (evt.clientY - scrollStartPosition()) * (contentOffsetHeight / thumbHeight());
      viewportRef.scrollTop = Math.min(
        initialScrollTop() + deltaY,
        contentScrollHeight - contentOffsetHeight,
      );
    }
  }

  onMount(() => {
    const { clientHeight: trackSize } = scrollTrackRef;
    observer = new ResizeObserver(() => {
      handleResize(viewportRef, trackSize);
    });
    observer.observe(viewportRef);
  });

  onCleanup(() => {
    observer.unobserve(viewportRef);
  });

  return (
    <div
      class="ScrollbarArea"
      onWheel={handleWheel}
      onPointerMove={handleThumbPointerMove}
      onPointerLeave={handleThumbPointerUpOrLeave}
      onPointerUp={handleThumbPointerUpOrLeave}
    >
      <div class="ScrollbarArea__wrapper">
        <div
          class="ScrollbarArea__viewport"
          id={viewportID()}
          role="document"
          ref={viewportRef}
          onScroll={handleThumbPosition}
        >
          {props.children}
        </div>
      </div>
      <div
        class="ScrollbarArea__scrollbar"
        role="scrollbar"
        aria-controls={viewportID()}
        aria-valuenow={scrollPosition()}
        aria-orientation="vertical"
      >
        <div
          class="ScrollbarArea__scrollbar-track"
          ref={scrollTrackRef}
          onClick={handleTrackClick}
          role="none"
        />
        <div
          class="ScrollbarArea__scrollbar-thumb"
          onPointerDown={handleThumbPointerDown}
          ref={scrollThumbRef}
          style={{
            height: `${thumbHeight()}px`,
            cursor: isDragging() ? 'grabbing' : 'grab',
          }}
        />
      </div>
    </div>
  );
};

export default ScrollbarArea;
