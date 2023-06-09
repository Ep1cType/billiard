import React, { createRef, Dispatch, PureComponent, SetStateAction, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { addListener, removeListener } from '../../utils/events';
import { raf } from 'shared/lib/react-timelines/utils/raf';
import { getNumericPropertyValue } from 'shared/lib/react-timelines/utils/get-numeric-property-value';
import { HandleLayoutChange } from 'shared/lib/react-timelines';
import { CreateTimeReturn } from 'shared/lib/react-timelines/utils/time';
import { Sidebar } from 'shared/lib/react-timelines/components/sidebar';
import { TimeBarItem, TrackItem } from 'shared/lib/react-timelines/types';
import { TimelineMain } from 'shared/lib/react-timelines/components/timeline';
import clsx from 'clsx';

const noop = () => {
};

type Props = {
	enableSticky: boolean;
	timebar: TimeBarItem[]; //PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	time: CreateTimeReturn; //PropTypes.shape({toX: PropTypes.func.isRequired,}).isRequired
	tracks: TrackItem[] //PropTypes.arrayOf(PropTypes.shape({})).isRequired
	now: Date; //PropTypes.instanceOf(Date)
	isOpen?: boolean;
	toggleTrackOpen?: () => void;
	scrollToNow?: boolean;
	onLayoutChange: (props: HandleLayoutChange) => void;
	sidebarWidth?: number
	timelineViewportWidth: number;
	clickElement?: (any: any) => void;
	clickTrackButton?: () => void;
}

export interface StickyObject {
	isSticky: boolean;
	setHeaderHeight: Dispatch<SetStateAction<number>>,
	viewportWidth: number,
	handleHeaderScrollY: (num: number) => void;
	headerHeight: number;
	scrollLeft: number;
}

export const Layout = (
	{
		enableSticky,
		onLayoutChange,
		sidebarWidth,
		timelineViewportWidth,
		clickElement,
		clickTrackButton,
		tracks,
		now,
		scrollToNow,
		toggleTrackOpen,
		isOpen,
		timebar,
		time,
	}: Props) => {
	const timelineRef = createRef<HTMLDivElement>();
	const layoutRef = createRef<HTMLDivElement>();
	const sidebarRef = createRef<HTMLDivElement>();

	const [isSticky, setIsSticky] = useState(false);
	const [headerHeight, setHeaderHeight] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);

	function updateTimelineHeaderScroll() {
		if (timelineRef.current) {
			const { scrollLeft } = timelineRef.current;
			setScrollLeft(scrollLeft);
		}
	}

	function updateTimelineBodyScroll() {
		if (timelineRef.current) {
			timelineRef.current.scrollLeft = scrollLeft;
		}
	}

	useEffect(() => {
		function wheelEvent(event: WheelEvent) {
			event.preventDefault();
			timelineRef.current?.scrollBy({
				left: event.deltaY < 0 ? -50 : 50
			})
		}

		if (timelineRef.current) {
			timelineRef.current.addEventListener("wheel", wheelEvent)
		}

		return () => {
			timelineRef.current && timelineRef.current.removeEventListener("wheel", wheelEvent)
		}
	}, [timelineRef])

	function calculateSidebarWidth() {
		if (sidebarRef.current) {
			return sidebarRef.current.offsetWidth + getNumericPropertyValue(layoutRef.current as Element, 'margin-left');
		}
	}

	function calculateTimelineViewportWidth() {
		if (timelineRef.current) {
			return timelineRef.current.offsetWidth;
		}
	}

	//TODO: CHANGE COEFFICIENT
	function handleScrollToNow() {
		if (scrollToNow) {
			if (timelineRef.current) {
				// timelineRef.current.scrollLeft = time.toX(now) - 0.5 * timelineViewportWidth;
				timelineRef.current.scrollLeft = time.toX(now) - (time.toX(now) / 6)
			}
		}
	}

	function handleScrollX() {
		raf(updateTimelineHeaderScroll);
	}

	function handleHeaderScrollY(scrollLeft: number) {
		raf(() => {
			setScrollLeft(scrollLeft);
		});
	}


	useEffect(() => {
		function handleScrollY() {
			raf(() => {
				const markerHeight = 0;
				if (timelineRef.current) {
					const { top, bottom } = timelineRef.current.getBoundingClientRect();
					const isSticky = top <= -markerHeight && bottom >= headerHeight;
					setIsSticky(isSticky);
				}
			});
		}

		if (enableSticky) {
			window.addEventListener('scroll', handleScrollY);
			updateTimelineHeaderScroll();
			updateTimelineBodyScroll();
		}


		return () => {
			window.removeEventListener('scroll', handleScrollY);
		};
	}, []);

	function handleLayoutChange() {
		if (timelineRef.current) {
			const nextSidebarWidth = calculateSidebarWidth();
			const nextTimelineViewportWidth = calculateTimelineViewportWidth();
			if (nextSidebarWidth !== sidebarWidth || nextTimelineViewportWidth !== timelineViewportWidth) {
				onLayoutChange(
					{
						sidebarWidth: calculateSidebarWidth() as number,
						timelineViewportWidth: calculateTimelineViewportWidth() as number,
					},
				);
			}
		}
	}

	useEffect(() => {
		window.addEventListener('resize', handleLayoutChange);
		handleScrollToNow();

		return () => window.removeEventListener('resize', handleLayoutChange);
	}, []);

	useEffect(() => {
		if (enableSticky && isSticky) {
			updateTimelineHeaderScroll();
			updateTimelineBodyScroll();
			handleLayoutChange();
		}

	}, [isSticky, scrollLeft, isOpen]);
	return (
		<div className={clsx(" rt-layout", isOpen && "rt-is-open")} ref={layoutRef}>
			{/*<div className='rt-layout__side' ref={sidebarRef}>*/}
			{/*	<Sidebar*/}
			{/*		timebar={timebar}*/}
			{/*		tracks={tracks}*/}
			{/*		toggleTrackOpen={toggleTrackOpen}*/}
			{/*		sticky={{ isSticky, headerHeight, sidebarWidth }}*/}
			{/*		clickTrackButton={clickTrackButton}*/}
			{/*	/>*/}
			{/*</div>*/}
			<div className='inline-block align-top w-[calc(100%)] rt-layout__main'>
				<div className='overflow-x-auto scrollBar rt-layout__timeline' ref={timelineRef} onScroll={isSticky ? handleScrollX : undefined}>
					<TimelineMain
						now={now}
						time={time}
						timebar={timebar}
						tracks={tracks}
						sticky={{
							isSticky,
							setHeaderHeight: setHeaderHeight,
							viewportWidth: timelineViewportWidth,
							handleHeaderScrollY: handleHeaderScrollY,
							headerHeight,
							scrollLeft,
						}}
						clickElement={clickElement}
					/>
				</div>
			</div>
		</div>
	);
};

// export class Layout extends PureComponent<Props, any> {
// 	constructor(props: Props) {
// 		super(props);
//
// 		this.timeline = React.createRef();
// 		this.layout = React.createRef();
// 		this.sidebar = React.createRef();
//
// 		this.state = {
// 			isSticky: false,
// 			headerHeight: 0,
// 			scrollLeft: 0,
// 		};
// 	}
//
// 	componentDidMount() {
// 		const { enableSticky } = this.props;
//
// 		if (enableSticky) {
// 			addListener('scroll', this.handleScrollY);
// 			this.updateTimelineHeaderScroll();
// 			this.updateTimelineBodyScroll();
// 		}
//
// 		addListener('resize', this.handleResize);
// 		this.handleLayoutChange(() => this.scrollToNow());
// 	}
//
// 	componentDidUpdate(prevProps, prevState) {
// 		const { enableSticky, isOpen } = this.props;
// 		const { isSticky, scrollLeft } = this.state;
//
// 		if (enableSticky && isSticky) {
// 			if (!prevState.isSticky) {
// 				this.updateTimelineHeaderScroll();
// 			}
//
// 			if (scrollLeft !== prevState.scrollLeft) {
// 				this.updateTimelineBodyScroll();
// 			}
// 		}
//
// 		if (isOpen !== prevProps.isOpen) {
// 			this.handleLayoutChange();
// 		}
// 	}
//
// 	componentWillUnmount() {
// 		const { enableSticky } = this.props;
//
// 		if (enableSticky) {
// 			removeListener('scroll', this.handleScrollY);
// 			removeListener('resize', this.handleResize);
// 		}
// 	}
//
// 	setHeaderHeight = headerHeight => {
// 		this.setState({ headerHeight });
// 	};
//
// 	scrollToNow = () => {
// 		const { time, scrollToNow, now, timelineViewportWidth } = this.props;
// 		if (scrollToNow) {
// 			this.timeline.current.scrollLeft = time.toX(now) - 0.5 * timelineViewportWidth;
// 		}
// 	};
//
// 	updateTimelineBodyScroll = () => {
// 		const { scrollLeft } = this.state;
// 		this.timeline.current.scrollLeft = scrollLeft;
// 	};
//
// 	updateTimelineHeaderScroll = () => {
// 		const { scrollLeft } = this.timeline.current;
// 		this.setState({ scrollLeft });
// 	};
//
// 	handleHeaderScrollY = scrollLeft => {
// 		raf(() => {
// 			this.setState({ scrollLeft });
// 		});
// 	};
//
// 	handleScrollY = () => {
// 		raf(() => {
// 			const { headerHeight } = this.state;
// 			const markerHeight = 0;
// 			const { top, bottom } = this.timeline.current.getBoundingClientRect();
// 			const isSticky = top <= -markerHeight && bottom >= headerHeight;
// 			this.setState(() => ({ isSticky }));
// 		});
// 	};
//
// 	handleScrollX = () => {
// 		raf(this.updateTimelineHeaderScroll);
// 	};
//
// 	calculateSidebarWidth = () =>
// 		this.sidebar.current.offsetWidth + getNumericPropertyValue(this.layout.current, 'margin-left');
//
// 	calculateTimelineViewportWidth = () => this.timeline.current.offsetWidth;
//
// 	handleLayoutChange = cb => {
// 		const { sidebarWidth, timelineViewportWidth, onLayoutChange } = this.props;
//
// 		const nextSidebarWidth = this.calculateSidebarWidth();
// 		const nextTimelineViewportWidth = this.calculateTimelineViewportWidth();
// 		if (nextSidebarWidth !== sidebarWidth || nextTimelineViewportWidth !== timelineViewportWidth) {
// 			onLayoutChange(
// 				{
// 					sidebarWidth: this.calculateSidebarWidth(),
// 					timelineViewportWidth: this.calculateTimelineViewportWidth(),
// 				},
// 				cb,
// 			);
// 		}
// 	};
//
// 	handleResize = () => this.handleLayoutChange();
//
// 	render() {
// 		const {
// 			isOpen,
// 			tracks,
// 			now,
// 			time,
// 			timebar,
// 			toggleTrackOpen,
// 			sidebarWidth,
// 			timelineViewportWidth,
// 			clickElement,
// 			clickTrackButton,
// 		} = this.props;
//
// 		const { isSticky, headerHeight, scrollLeft } = this.state;
// 		return (
// 			<div className={`rt-layout ${isOpen ? 'rt-is-open' : ''}`} ref={this.layout}>
// 				<div className='rt-layout__side' ref={this.sidebar}>
// 					<Sidebar
// 						timebar={timebar}
// 						tracks={tracks}
// 						toggleTrackOpen={toggleTrackOpen}
// 						sticky={{ isSticky, headerHeight, sidebarWidth }}
// 						clickTrackButton={clickTrackButton}
// 					/>
// 				</div>
// 				<div className='rt-layout__main'>
// 					<div className='rt-layout__timeline' ref={this.timeline} onScroll={isSticky ? this.handleScrollX : noop}>
// 						<Timeline
// 							now={now}
// 							time={time}
// 							timebar={timebar}
// 							tracks={tracks}
// 							sticky={{
// 								isSticky,
// 								setHeaderHeight: this.setHeaderHeight,
// 								viewportWidth: timelineViewportWidth,
// 								handleHeaderScrollY: this.handleHeaderScrollY,
// 								headerHeight,
// 								scrollLeft,
// 							}}
// 							clickElement={clickElement}
// 						/>
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}
// }

// Layout.propTypes = {
// 	enableSticky: PropTypes.bool.isRequired,
// 	timebar: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
// 	time: PropTypes.shape({
// 		toX: PropTypes.func.isRequired,
// 	}).isRequired,
// 	tracks: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
// 	now: PropTypes.instanceOf(Date),
// 	isOpen: PropTypes.bool,
// 	toggleTrackOpen: PropTypes.func,
// 	scrollToNow: PropTypes.bool,
// 	onLayoutChange: PropTypes.func.isRequired,
// 	sidebarWidth: PropTypes.number,
// 	timelineViewportWidth: PropTypes.number,
// 	clickElement: PropTypes.func,
// 	clickTrackButton: PropTypes.func,
// };
