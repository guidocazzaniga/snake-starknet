interface FoodProps {
    dot: number[]
}
const dotsDistance = 12
export default function Food(props: FoodProps) {
    const styleFood = {
        left: `${props.dot[0] * dotsDistance}%`,
        top: `${(7 - props.dot[1]) * dotsDistance}%`
    }
    return (
        <div className="snake-food" style={styleFood}>
        </div>
    )
}