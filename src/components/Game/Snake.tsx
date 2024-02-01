interface SnakeProps {
    snakeDots: number[][]
}
const dotsDistance = 12
export default function Snake(props: SnakeProps) {
    return (
        <div>
            {props.snakeDots.map((dot, index) => {
                const styleDot = {
                    left: `${dot[0] * dotsDistance}%`,
                    top: `${(7 - dot[1]) * dotsDistance}%`
                }
                return (
                    <div className="snake-dot" key={index} style={styleDot}></div>

                )
            })}
        </div>
    )
}